// https://cdn.geekfactory.mx/sim7000g/SIM7000%20Series_AT%20Command%20Manual_V1.06.pdf
#define HTTPSSERVER "logbook-1oi.pages.dev"
#define HTTPSPATH "/boats/TN661NmwYR1MDieq6TfPD/logentries/apiUpload.get"
#define SOFTWARE_VERSION "1.0.0"
#define APN "iot.1nce.net"
#define DEBUG // Comment out to disable debugging
// #define DUMP_AT_COMMANDS // Comment out to disable AT command debugging - which is the commands back and forth between the chip and the modem

// Set serial for debug console (to the Serial Monitor, default speed 115200)
#define SerialMon Serial

// Set serial for AT commands (to the module)
// Use Hardware Serial on Mega, Leonardo, Micro
#define SerialAT Serial1

#define TINY_GSM_MODEM_SIM7000SSL
#define TINY_GSM_RX_BUFFER 1024 // Set RX buffer to 1Kb
#define SerialAT Serial1

// See all AT commands, if wanted

#include <TinyGsmClient.h> //Need to install https://github.com/vshymanskyy/TinyGSM v0.12.0
#include <SPI.h>
#include <SD.h>
#include <Ticker.h>
#include <EEPROM.h>
#include <ArduinoHttpClient.h> //Need to install https://github.com/arduino-libraries/ArduinoHttpClient v0.6.1
#include <ArduinoJson.h>       //Need to install https://github.com/bblanchon/ArduinoJson v7.1.0
#include <esp_adc_cal.h>

#ifdef DUMP_AT_COMMANDS
#include <StreamDebugger.h>
StreamDebugger debugger(SerialAT, SerialMon);
TinyGsm modem(debugger);
#else
TinyGsm modem(SerialAT);
#endif

TinyGsmClientSecure client(modem);
HttpClient http(client, HTTPSSERVER, 443);

#define TIME_TO_SLEEP 60        // Time (in seconds) to sleep between readings normally
#define TIME_TO_SLEEP_NOGPS 300 // Time (in seconds) to sleep between readings if we can't get a GPS fix
#define TIME_TO_SLEEP_BATT 600  // Time (in seconds) to sleep between readings if we're on battery, not moving and trying to save battery

#define UART_BAUD 115200
#define PIN_DTR 25
#define PIN_TX 27
#define PIN_RX 26
#define PWR_PIN 4

#define SD_MISO 2
#define SD_MOSI 15
#define SD_SCLK 14
#define SD_CS 13

#define LED_PIN 12

#define ADC_PIN 35   // For battery voltage
int vref = 1100;     // For battery voltage
#define SOLAR_ADC 36 // For solar voltage

void enableGPS(void)
{
    // Set Modem GPS Power Control Pin to HIGH ,turn on GPS power
    // Only in version 20200415 is there a function to control GPS power
    modem.sendAT("+CGPIO=0,48,1,1");
    if (modem.waitResponse(10000L) != 1)
    {
#ifdef DEBUG
        Serial.println("Set GPS Power HIGH Failed - restarting");
#endif
        ESP.restart();
    }
    modem.enableGPS();
}

void disableGPS(void)
{
    // Set Modem GPS Power Control Pin to LOW ,turn off GPS power
    // Only in version 20200415 is there a function to control GPS power
    modem.sendAT("+CGPIO=0,48,1,0");
    if (modem.waitResponse(10000L) != 1)
    {
#ifdef DEBUG
        Serial.println("Set GPS Power LOW Failed - restarting");
#endif
        ESP.restart();
    }
    modem.disableGPS();
}

void modemPowerOn()
{
    pinMode(PWR_PIN, OUTPUT);
    digitalWrite(PWR_PIN, LOW);
    delay(1000); // Datasheet Ton mintues = 1S
    digitalWrite(PWR_PIN, HIGH);
}

void modemPowerOff()
{
    pinMode(PWR_PIN, OUTPUT);
    digitalWrite(PWR_PIN, LOW);
    delay(1500); // Datasheet Ton mintues = 1.2S
    digitalWrite(PWR_PIN, HIGH);
}

void modemRestart()
{
    modemPowerOff();
    delay(1000);
    modemPowerOn();
}

void sleep(int timeSeconds)
{
    modemPowerOff();
    esp_sleep_enable_timer_wakeup(timeSeconds * 1000000ULL); // Conversion factor for micro seconds to seconds
    delay(200);
    esp_deep_sleep_start();
}

uint8_t signalQualityDBM()
{
    // Returns signal quality in dBm
    int16_t sq = modem.getSignalQuality();

    if (sq == 0)
        return 115;
    if (sq == 1)
        return 111;
    if (sq == 31)
        return 52;
    if (sq == 99)
        return 255;

    return (((sq - 2) * -2) + 110);
}

float batteryLevel()
{
    // Returns voltage in V
    uint16_t v = analogRead(ADC_PIN);
    return ((float)v / 4095.0) * 2.0 * 3.3 * (vref / 1000.0);
    // When connecting USB, the battery detection will return 0,
    // because the adc detection circuit is disconnected when connecting USB
}
float solarVoltage()
{
    // Returns voltage in V
    uint16_t v = analogRead(SOLAR_ADC);
    return ((float)v / 4095.0) * 2.0 * 3.3 * (vref / 1000.0);
    // When connecting USB, the battery detection will return 0,
    // because the adc detection circuit is disconnected when connecting USB
}
int distanceBetweenLatLongHaversine(float lat1, float lon1, float lat2, float lon2)
{
    // returns distance in meters between two positions, both specified
    // as signed decimal-degrees latitude and longitude. Uses great-circle
    // distance computation for hypothetical sphere of radius 6372795 meters.
    // Because Earth is no exact sphere, rounding errors may be up to 0.5%.
    // Courtesy of Maarten Lamers

    float delta = radians(lon1 - lon2);
    float sdlong = sin(delta);
    float cdlong = cos(delta);
    lat1 = radians(lat1);
    lat2 = radians(lat2);
    float slat1 = sin(lat1);
    float clat1 = cos(lat1);
    float slat2 = sin(lat2);
    float clat2 = cos(lat2);
    delta = (clat1 * slat2) - (slat1 * clat2 * cdlong);
    delta = sq(delta);
    delta += sq(clat2 * sdlong);
    delta = sqrt(delta);
    float denom = (slat1 * slat2) + (clat1 * clat2 * cdlong);
    delta = atan2(delta, denom);
    return int(delta * 6372795);
}

void setup()
{
    // Set console baud rate
    Serial.begin(115200);

    // Set LED OFF
    pinMode(LED_PIN, OUTPUT);
    digitalWrite(LED_PIN, HIGH);

    if (!EEPROM.begin(10))
    { // Allow it to be up to 10 bytes - two floats for location plus an int for retry count
#ifdef DEBUG
        Serial.println("EEPROM failed to initialise");
#endif
        ESP.restart();
    }

    // Calibrate the battery & solar sensors
    esp_adc_cal_characteristics_t adc_chars;
    esp_adc_cal_value_t val_type = esp_adc_cal_characterize(ADC_UNIT_1, ADC_ATTEN_DB_11, ADC_WIDTH_BIT_12, 1100, &adc_chars); // Check type of calibration value used to characterize ADC
    if (val_type == ESP_ADC_CAL_VAL_EFUSE_VREF)
    {
#ifdef DEBUG
        Serial.printf("eFuse Vref:%u mV", adc_chars.vref);
#endif
        vref = adc_chars.vref;
    }
#ifdef DEBUG
    else if (val_type == ESP_ADC_CAL_VAL_EFUSE_TP)
    {
        Serial.printf("Two Point --> coeff_a:%umV coeff_b:%umV\n", adc_chars.coeff_a, adc_chars.coeff_b);
    }
    else
    {
        Serial.println("Default Vref: 1100mV");
    }
#endif

    modemPowerOn();

    /*
    // Setup the micro SD card
    SPI.begin(SD_SCLK, SD_MISO, SD_MOSI);
    if (!SD.begin(SD_CS)) {
        Serial.println("> It looks like you haven't inserted the SD card..");
    } else {
        uint32_t cardSize = SD.cardSize() / (1024 * 1024);
        String str = "> SDCard Size: " + String(cardSize) + "MB";
        Serial.println(str);
    }
    */

    SerialAT.begin(UART_BAUD, SERIAL_8N1, PIN_RX, PIN_TX);
    delay(6000);

    modem.restart();
#ifdef DEBUG
    Serial.println("> Check whether Modem is online");
#endif
    // test modem is online ?
    uint32_t timeout = millis();
    while (!modem.testAT())
    {
#ifdef DEBUG
        Serial.print(".");
#endif
        if (millis() - timeout > 60000)
        {
#ifdef DEBUG
            Serial.println("> It looks like the modem is not responding, trying to restart");
#endif
            modemPowerOff();
            delay(5000);
            modemPowerOn();
            timeout = millis();
        }
    }
#ifdef DEBUG
    Serial.println("\nModem is online");
#endif

    // test sim card is online ?
    timeout = millis();
#ifdef DEBUG
    Serial.println("> Get SIM card status");
#endif
    while (modem.getSimStatus() != SIM_READY)
    {
        if (millis() - timeout > 60000)
        {
#ifdef DEBUG
            Serial.println("It seems that your SIM card has not been detected. Has it been inserted?");
            Serial.println("If you have inserted the SIM card, please remove the power supply again and try again!");
#endif
            return;
        }
    }
#ifdef DEBUG
    Serial.println();
    Serial.println("> SIM card exists");

    Serial.println("> /**********************************************************/");
    Serial.println("> Please make sure that the location has 2G/NB-IOT signal");
    Serial.println("> SIM7000/SIM707G does not support 4G network. Please ensure that the USIM card you use supports 2G/NB access");
    Serial.println("> /**********************************************************/");
#endif

    /*
    String res = modem.getIMEI();
    Serial.print("IMEI:");
    Serial.println(res);
    Serial.println();
    */

    /*
     * Tips:
     * When you are not sure which method of network access is supported by the network you use,
     * please use the automatic mode. If you are sure, please change the parameters to speed up the network access
     * * * * */

    // Set mobile operation band
    modem.sendAT("+CBAND=ALL_MODE");
    modem.waitResponse();

    // Args:
    // 1 CAT-M
    // 2 NB-IoT
    // 3 CAT-M and NB-IoT
    // Set network preferre to NB-IOT
    uint8_t perferred = 2;
    modem.setPreferredMode(perferred);

    // Args:
    // 2 Automatic
    // 13 GSM only
    // 38 LTE only
    // 51 GSM and LTE only
    // Set network mode to auto
    modem.setNetworkMode(2);

    modem.sendAT(GF("+CAPNMODE="), 1);
    if (modem.waitResponse() != 1)
    {
        // Can't if debug this out as otherwise causes a logic error as there's no code in the if statement
        Serial.println("> Could not set APN Mode to manual");
    }
    modem.gprsConnect(APN); // APN

    SIM70xxRegStatus status;
    timeout = millis();
    do
    {
        /*
        0 - 115 dBm or less
        1 - 111 dBm
        2...30 - 110... - 54 dBm
        31 - 52 dBm or greater
        */
        int16_t sq = modem.getSignalQuality();

        status = modem.getRegistrationStatus();
#ifdef DEBUG
        if (status == REG_DENIED)
        {

            Serial.println("> The SIM card you use has been rejected by the network operator. Please check that the card you use is not bound to a device!");

            return;
        }
        else
        {
            Serial.print("Signal:");
            Serial.println(sq);
        }
#endif

        if (millis() - timeout > 360000)
        {
            if (sq == 99)
            {
#ifdef DEBUG
                Serial.println("> It seems that there is no signal. Please check whether the"
                               "LTE antenna is connected. Please make sure that the location has 2G/NB-IOT signal\n"
                               "SIM7000G does not support 4G network. Please ensure that the USIM card you use supports 2G/NB access");
#endif
                return;
            }
            timeout = millis();
        }

        delay(800);
    } while (status != REG_OK_HOME && status != REG_OK_ROAMING);

    /*Serial.println("Obtain the APN issued by the network");
    modem.sendAT("+CGNAPN");
    if (modem.waitResponse(3000, res) == 1) {
        res = res.substring(res.indexOf(",") + 1);
        res.replace("\"", "");
        res.replace("\r", "");
        res.replace("\n", "");
        res.replace("OK", "");
        Serial.print("The APN issued by the network is:");
        Serial.println(res);
    }

    //modem.sendAT("+CNACT=1");
    //modem.waitResponse();


    // res = modem.getLocalIP();
    modem.sendAT("+CNACT?");
    if (modem.waitResponse("+CNACT: ") == 1) {
        modem.stream.read();
        modem.stream.read();
        res = modem.stream.readStringUntil('\n');
        res.replace("\"", "");
        res.replace("\r", "");
        res.replace("\n", "");
        modem.waitResponse();
        Serial.print("The current network IP address is:");
        Serial.println(res);
    }


    modem.sendAT("+CPSI?");
    if (modem.waitResponse("+CPSI: ") == 1) {
        res = modem.stream.readStringUntil('\n');
        res.replace("\r", "");
        res.replace("\n", "");
        modem.waitResponse();
        Serial.print("The current network parameter is:");
        Serial.println(res);
    }
    */
#ifdef DEBUG
    Serial.println("Network has booted");
#endif
}

bool httpsGetRequest(float lat, float lon, float speed, float alt, int year, int month, int day, int hour, int minute, int second, int sleepTime, int delayTime)
{
#ifdef DEBUG
    Serial.println("Performing HTTPS GET request to upload on a 60 second timeout...");
#endif
    // Update the retry count
    int retryCount = 0;
    EEPROM.get(8, retryCount);
    if (isnan(retryCount))
    {
        retryCount = 0;
    }
    EEPROM.put(8, retryCount + 1);
    EEPROM.commit();

    http.connectionKeepAlive(); // Needed for HTTPs
    // http.setHttpResponseTimeout(60000); // 60 seconds
    int requestStart = millis();
    String url = String(HTTPSPATH) + "?lat=" + String(lat, 8) + "&lon=" + String(lon, 8) + "&sog=" + String(speed, 2) + "&alt=" + String(alt, 2) + "&y=" + String(year) + "&j=" + String(month) + "&d=" + String(day) + "&h=" + String(hour) + "&m=" + String(minute) + "&s=" + String(second) + "&sig=" + String(signalQualityDBM()) + "&bat=" + String(batteryLevel(), 4) + "&vlt=" + String(solarVoltage(), 4) + "&id=" + String(ESP.getEfuseMac()) + "&slp=" + String(sleepTime) + "&dly=" + String(delayTime) + "&rty=" + String(retryCount) + "&ver=" + String(SOFTWARE_VERSION);
#ifdef DEBUG
    Serial.println(url);
#endif
    int err = http.get(url);
    if (err != 0)
    {
        /*
          HTTP_SUCCESS =0;
          HTTP_ERROR_CONNECTION_FAILED =-1;
          HTTP_ERROR_API =-2;
          HTTP_ERROR_TIMED_OUT =-3;
          HTTP_ERROR_INVALID_RESPONSE =-4;
        */
#ifdef DEBUG
        Serial.print(err);
        Serial.println(F(" failed to connect"));
#endif
        http.stop();
        return false;
    }

    int status = http.responseStatusCode();
#ifdef DEBUG
    Serial.print(F("Response status code: "));
    Serial.println(status);
#endif
    if (!status)
    {
        http.stop();
        return false;
    }

    if (status > 299 || status < 200)
    {
        http.stop();
        return false;
    }

    // http.skipResponseHeaders();
#ifdef DEBUG
    Serial.println(F("Response Headers:"));
#endif
    while (http.headerAvailable())
    {
        String headerName = http.readHeaderName();
        String headerValue = http.readHeaderValue();
#ifdef DEBUG
        Serial.println("    " + headerName + " : " + headerValue);
#endif
    }

    int length = http.contentLength();
#ifdef DEBUG
    if (length >= 0)
    {
        Serial.print(F("Content length is: "));
        Serial.println(length);
    }
    if (http.isResponseChunked())
    {
        Serial.println(F("The response is chunked"));
    }
#endif
    /*
    String body = http.responseBody();
    Serial.println(F("Response:"));
    Serial.println(body);

    Serial.print(F("Body length is: "));
    Serial.println(body.length());*/

    String body = http.responseBody(); // You need to read the body to clear the buffer, if you don't it'll break subsequent requests
#ifdef DEBUG
    Serial.println(body);
#endif
    // Shutdown
    http.stop();

#ifdef DEBUG
    Serial.print("HTTPs GET Request took ");
    Serial.print((millis() - requestStart) / 1000);
    Serial.println(" seconds");
#endif

    // Reset the retry count
    EEPROM.put(8, 0);
    EEPROM.commit();

    return true;
}
/*
bool httpsPutRequest(String json)
{
    Serial.print(F("Performing HTTPS PUT request to upload... "));
    HttpClient http(client, HTTPSSERVER, 443);
    http.connectionKeepAlive(); // Needed for HTTPs
    Serial.println(json);
    int err = http.put(HTTPSPATH, "application/json", json);
    if (err != 0)
    {
        Serial.print(err);
        Serial.println(F(" failed to connect"));
        http.stop();
        return false;
    }

    int status = http.responseStatusCode();
    Serial.print(F("Response status code: "));
    Serial.println(status);
    if (!status)
    {
        http.stop();
        return false;
    }

    if (status > 299 || status < 200)
    {
        http.stop();
        return false;
    }

    Serial.println(F("Response Headers:"));
    while (http.headerAvailable())
    {
        String headerName = http.readHeaderName();
        String headerValue = http.readHeaderValue();
        Serial.println("    " + headerName + " : " + headerValue);
    }

    int length = http.contentLength();
    if (length >= 0)
    {
        Serial.print(F("Content length is: "));
        Serial.println(length);
    }
    if (http.isResponseChunked())
    {
        Serial.println(F("The response is chunked"));
    }

    String body = http.responseBody();
    Serial.println(F("Response:"));
    Serial.println(body);

    Serial.print(F("Body length is: "));
    Serial.println(body.length());

    // Shutdown
    http.stop();
    return true;
}*/

void loop()
{
    // AT Debug
    // while (SerialAT.available()) {
    //     Serial.write(SerialAT.read());
    // }
    // while (Serial.available()) {
    //     SerialAT.write(Serial.read());
    // }

#ifdef DEBUG
    Serial.print("Started main loop - timestamp: ");
    Serial.println(millis() / 1000);
#endif

    float eepromLat, eepromLon;
    EEPROM.get(0, eepromLat);
    EEPROM.get(4, eepromLon);
#ifdef DEBUG
    Serial.println(eepromLat, 6);
    Serial.println(eepromLon, 6);
#endif
    enableGPS();

#ifdef DEBUG
    Serial.println("Acquiring GPS");
#endif
    int startedAcquiringGPS = millis();

    float lat, lon, speed, alt, accuracy;
    int vsat, usat, year, month, day, hour, minute, second;
    bool foundGPS = false;
    while ((millis() - startedAcquiringGPS) < 300000)
    { // Only wait 5 minutes
        if (modem.getGPS(&lat, &lon, &speed, &alt, &vsat, &usat, &accuracy, &year, &month, &day, &hour, &minute, &second))
        {
#ifdef DEBUG
            Serial.println("The location has been locked, the latitude and longitude are:");
            Serial.print("latitude:");
            Serial.println(lat, 6);
            Serial.print("longitude:");
            Serial.println(lon, 6);
            Serial.print("Speed Over Ground. Unit is knots.:");
            Serial.println(speed);
            Serial.print("MSL Altitude. Unit is meters:");
            Serial.println(alt);
            Serial.print("GNSS Satellites in View:");
            Serial.println(vsat);
            Serial.print("GNSS Satellites Used:");
            Serial.println(usat);
            Serial.print("Horizontal Dilution Of Precision:");
            Serial.println(accuracy);
            Serial.print("UTC year:");
            Serial.println(year);
            Serial.print("UTCmonth:");
            Serial.println(month);
            Serial.print("UTCday:");
            Serial.println(day);
            Serial.print("UTChour:");
            Serial.println(hour);
            Serial.print("UTCminute:");
            Serial.println(minute);
            Serial.print("UTCsecond:");
            Serial.println(second);
#endif

            foundGPS = true;

            // TODO get this working
            EEPROM.put(0, lat);
            EEPROM.put(4, lon);
            EEPROM.commit();

            break;
        }
        // Flash the blue LED every 0.5 seconds whilst hunting location
        digitalWrite(LED_PIN, !digitalRead(LED_PIN));
        delay(500);
    }

    disableGPS();

    digitalWrite(LED_PIN, HIGH); // Go high once we've finished hunting for GPS
#ifdef DEBUG
    Serial.print("Took ");
    Serial.print(millis() / 1000);
    Serial.println(" seconds to get GPS fix");
#endif
    /**
     * Calculate the sleep time that would be appropriate for the next loop
     */
    int sleepTime = 0; // How long to go to deep sleep for
    int delayTime = 0; // How long to delay for - this will
    float solarVoltageValue = solarVoltage();
    if (!foundGPS)
    {
// If we didn't get a GPS fix, sleep for 5 minutes - even if the solar panel is charging. We might be inside a bag or something odd
#ifdef DEBUG
        Serial.print("On the basis of no GPS, setting SLEEP timer for ");
        Serial.println(TIME_TO_SLEEP_NOGPS);
#endif
        sleepTime = TIME_TO_SLEEP_NOGPS;
    }
    else if (isnan(eepromLat) || isnan(eepromLon))
    {
// Has never had a fix, so might as well just stay awake and go round again straight away - its first boot basically
#ifdef DEBUG
        Serial.println("No previous GPS fix, so won't sleep on this cycle");
#endif
        delayTime = 1;
    }
    else if (solarVoltageValue > 0.1)
    {
// If we're charging, don't sleep, we'll assume power is unlimited and free
#ifdef DEBUG
        Serial.print("Charging, so going to set DELAY timer for ");
        Serial.println(TIME_TO_SLEEP);
#endif
        delayTime = TIME_TO_SLEEP;
    }
    else
    {
        int distance = distanceBetweenLatLongHaversine(eepromLat, eepromLon, lat, lon);
#ifdef DEBUG
        Serial.print("Distance between this latlong and previous latlong calculated as ");
        Serial.print(distance);
        Serial.println(" meters");
#endif
        if (distance > 15) 
        {
// Moved more than 15 meters from last known location which suggests we're moving enough that we should try and send more data more quickly, and that its probably not a GPS error. If we're checking every 60 seconds then that equates to about 0.5knots of speed, which feels like a sensible enough threshold to ping a bit more
#ifdef DEBUG
            Serial.print("Moved more than 15m since last GPS fix, so using up a bit more battery to stay awake data more frequently. Setting a SLEEP timer for ");
            Serial.print(TIME_TO_SLEEP);
            Serial.println(" seconds");
#endif
            sleepTime = TIME_TO_SLEEP;
        }
        else
        {
// We're not moving and we're not charging, so lets rein back in the battery usage
#ifdef DEBUG
            Serial.print("Moved less than 15m, so going for a longer SLEEP timer ");
            Serial.print(TIME_TO_SLEEP_BATT);
            Serial.println(" seconds");
#endif
            sleepTime = TIME_TO_SLEEP_BATT;
        }
    }

    SIM70xxRegStatus s = modem.getRegistrationStatus();
    if (s != REG_OK_HOME && s != REG_OK_ROAMING)
    {
#ifdef DEBUG
        Serial.println("Devices lost network connect!");
#endif
        ESP.restart();
    }
    else
    {
        int retryCount = 0;
        while (retryCount < 3)
        {
#ifdef DEBUG
            Serial.println("Sending data to server");
#endif
            if (foundGPS)
            {
                if (httpsGetRequest(lat, lon, speed, alt, year, month, day, hour, minute, second, sleepTime, delayTime))
                {
                    break;
                }
            }
            else
            {
                if (httpsGetRequest(-91, -181, -99, -99, 0, 0, 0, 0, 0, 0, sleepTime, delayTime))
                {
                    break;
                }
            }
            retryCount++;
        }

        /*
        JsonDocument doc;
        String json;
        if (foundGPS)
        {
            doc["lat"] = lat;
            doc["lon"] = lon;
            doc["sogkts"] = speed;
            doc["alt"] = alt;
            doc["utc"]["year"] = String(year);
            doc["utc"]["month"] = String(month);
            doc["utc"]["day"] = String(day);
            doc["utc"]["hour"] = String(hour);
            doc["utc"]["minute"] = String(minute);
            doc["utc"]["second"] = String(second);
        }
        doc["sig"] = signalQualityDBM();
        doc["batt"] = batteryLevel();
        doc["sol"] = solarVoltage();
        doc["id"] = ESP.getEfuseMac();
        serializeJson(doc, json);
        Serial.println(json);
        httpsPutRequest(json);
        */
    }

#ifdef DEBUG
    Serial.print("Cycle complete: ");
    Serial.println(millis() / 1000);
#endif
    digitalWrite(LED_PIN, LOW); // Go low as we drift off to sleep
    if (sleepTime > 0)
    {
        sleep(sleepTime);
    }
    else
    {
        delay(delayTime * 1000);
    }
}