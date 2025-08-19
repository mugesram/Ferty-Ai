#include<SoftwareSerial.h>

#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

// OLED display setup
#define OLED_RESET 4
Adafruit_SSD1306 display(OLED_RESET);

// RS485 Control Pins
#define RE 11
#define DE 10

// Modbus inquiry frames (predefined requests to slave device)
const byte inquiry_frame[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};
const byte inquiry_frame_1[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x01, 0xE4, 0x0C};
const byte inquiry_frame_2[] = {0x01, 0x03, 0x00, 0x1F, 0x00, 0x01, 0xB5, 0xCC};
const byte inquiry_frame_3[] = {0x01, 0x03, 0x00, 0x02, 0x00, 0x01, 0x85, 0xC0};

// Buffers for received values
byte values[13];
byte nut[3];
int command = 0;

// Software serial ports
SoftwareSerial mod(5,6); // RS485 module connected here
SoftwareSerial Bt(2, 3); // Bluetooth module connected here


void setup() {
  Serial.begin(9600);
  Bt.begin(9600);
  pinMode(RE,OUTPUT);
  pinMode(DE,OUTPUT);
  digitalWrite(RE,LOW);
  digitalWrite(DE,LOW);

  // Initialize OLED
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.clearDisplay();
  display.setTextSize(3);
 display.setTextColor(WHITE);
 display.setCursor(35,8);
 display.println("IOM"); 
  display.display();

}

void loop() {
  display.clearDisplay();
  delay(250);

  // Check if Bluetooth has received a command
  if(Bt.available()){
    String r = String(Bt.readString());
    command = r.toInt();
  }
  Serial.println(command);

  // If command == 1, start Modbus communication
  if(command == 1){
  Bt.end();  
  mod.begin(9600);  
  show();
  read();
  mod.end();
  Bt.begin(9600);

  // Convert nutrient values to strings
  int n =  nut[0];
  char ns[16];
  itoa(n, ns, 10);

  int p =  nut[1];
  char ps[16];
  itoa(p, ps, 10);

  int k =  nut[2];
  char ks[16];
  itoa(k, ks, 10);

  // Build comma-separated data string: "N,P,K"
  char deli[16] = ",";
  char data[64] = "";
  strcat(data,ns);
  strcat(data,deli);
  strcat(data,ps);
  strcat(data,deli);
  strcat(data,ks);

  Serial.println(data);
  Bt.write(data);
  Serial.println(nut[0]);
  Serial.println();
  delay(1000);
  }else{
  display.setTextSize(3);
 display.setCursor(35,8);
 display.println("IOM"); 
  display.display();
  }

 
  
}

void read(){
// Send Modbus inquiry frame and collect response
 
  digitalWrite(DE,HIGH);
  digitalWrite(RE,HIGH);
  delay(10);
  int data = mod.write(inquiry_frame,sizeof(inquiry_frame));
    digitalWrite(DE,LOW);
    digitalWrite(RE,LOW);
    delay(50);

   // Parse valid response and extract nutrient values
    if(mod.available()>0){
    int i=0;
    int nut_c = 0;
    
    while( mod.available()>0){
    //Serial.print(mod.read(),HEX);
    values[i] = mod.read();
    // Serial.println(values[i],HEX);
    i = i + 1;
    }

    
  
   
  

    }
    int length = sizeof(values);

   
    if(length > 3){
    for (int n=0;n<length-2;n++){
        if (values[n] == 1 && values[n+1] == 3 && values[n+2]==6){
          nut[0] = values[n+4];
          nut[1] = values[n+6];
          nut[2] = values[n+8];
        }
    }
    
    }
}




void show(){
  // Simple OLED message during calculation
  display.setTextSize(1);
  display.setCursor(22, 12);
  display.print("Calculating...");


  display.display();
}
