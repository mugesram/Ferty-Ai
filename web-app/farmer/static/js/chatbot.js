document.getElementById("send-button").addEventListener("click", sendMessage);
document
  .getElementById("user-input")
  .addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  });

// Add event listeners to sample prompts
document
  .querySelectorAll("#sample-prompts-container .sample-prompt")
  .forEach((item) => {
    item.addEventListener("click", function () {
      const userInput = this.textContent;
      document.getElementById("user-input").value = userInput;
      sendMessage();
    });
  });

const history = [];

async function sendMessage() {
  const userInput = document.getElementById("user-input").value;
  if (!userInput.trim()) return;
  history.push({ role: 'user', content: userInput });
  // Hide Agribot's welcome message
  const agribotWelcome = document.getElementById("agribot-welcome");
  if (agribotWelcome) {
    agribotWelcome.style.display = "none";
  }

  appendMessage("You", userInput, "user-message", "user-icon");
  document.getElementById("user-input").value = "";

  // Add loading message
  appendMessage("AgriBot", "Thinking...", "bot-message", "bot-icon");
  const response = await fetchChatGPTResponse(userInput, history);
  // Remove loading message
  document.querySelector(".message.bot-message:last-child").remove();

  const cleanResponse = formatChatGPTResponse(response);
  appendMessage("AgriBot", cleanResponse, "bot-message", "bot-icon");

  history.push({ role: 'assistant', content: cleanResponse });
}

function appendMessage(sender, message, messageType, iconClass) {
  const chatBox = document.getElementById("chat-box");
  const messageElement = document.createElement("div");
  messageElement.className = `message ${messageType}`;

  // Create a container for the icon and text
  const containerElement = document.createElement("div");
  containerElement.className = "message-container";

  // Create icon element
  const iconElement = document.createElement("i");
  iconElement.className = `${iconClass} message-icon`;

  // Create message text element
  const textElement = document.createElement("span");
  // textElement.innerHTML = message;
  // Replace newline characters with <br> tags
  textElement.innerHTML = message.replace(/\n/g, "<br />");

  // Append icon and text to the container
  containerElement.appendChild(iconElement);
  containerElement.appendChild(textElement);

  // Append the container to the message element
  messageElement.appendChild(containerElement);

  chatBox.appendChild(messageElement);
  chatBox.scrollTop = chatBox.scrollHeight;
}


function formatChatGPTResponse(response) {
  let formattedResponse = response.trim();
  // Replace newline characters with <br> tags
  formattedResponse = formattedResponse.replace(/(?:\r\n|\r|\n)/g, "<br>");
  // Replace **text** with <strong>text</strong> for bold formatting
  formattedResponse = formattedResponse.replace(
    /\*\*(.*?)\*\*/g,
    "<strong>$1</strong>"
  );
  // Replace *text* with <em>text</em> for italic formatting
  formattedResponse = formattedResponse.replace(/\*(.*?)\*/g, "<em>$1</em>");
  // Replace _text_ with <u>text</u> for underline formatting
  formattedResponse = formattedResponse.replace(/_(.*?)_/g, "<u>$1</u>");
  return formattedResponse;
}

async function fetchChatGPTResponse(userMessage, history, retries = 3) {
  const apiKey = "{Your api Key}";
  // Replace with your actual API key
  const apiUrl = "https://api.openai.com/v1/chat/completions"; // Updated endpoint for chat models

  try {
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Updated model name
        messages: [
          { role: "system", content: generatePrompt(userMessage) },
          ...history,
          { role: "user", content: userMessage },
        ],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429 && retries > 0) {
        console.log("Rate limit exceeded. Retrying...");
        await new Promise((res) => setTimeout(res, 1000)); // Wait before retrying
        return fetchChatGPTResponse(userMessage, history, retries - 1); // Retry request
      }
      const errorData = await response.json();
      throw new Error(
        `HTTP error! status: ${response.status}, ${errorData.error.message}`
      );
    }

    const data = await response.json();
    return data.choices[0].message.content.trim(); // Adjust based on the API response structure
  } catch (error) {
    console.error("Error fetching response from OpenAI:", error);
    return `Sorry, there was an error processing your request. ${error.message}`;
  }
}

function generatePrompt(userMessage) {
  return `You are AgriBot, an AI-powered chatbot designed to provide expert advice on farming and agriculture. 
    You have expertise in suggesting suitable plants based on soil nutrient levels (potassium, nitrogen, phosphorus) and offering tips on how to grow them successfully.

Plant          | Urea(N) mg/kg | TSP(P) mg/kg | MOP(K) mg/kg
-----------------------------------------------------------
Tomato         | 85   4.25926  | 325  73.125  | 65  34.125
Potato         | 165  21.38889 | 270  60.75   | 125 65.625
Corn           | 240  31.11111 | 100  22.5    | 50  26.25
Carrot         | 110  14.25926 | 270  60.75   | 55  44.625
Onion          | 150  19.44444 | 100  22.5    | 50  26.25
Chillie        | 125  16.2037  | 100  22.5    | 50  26.25
Brinjal        | 75   9.722222 | 325  73.125  | 85  44.625
Pumpkin        | 75   9.722222 | 200  45      | 60  31.5
Ladies Finger  | 100  12.96296 | 195  43.875  | 50  26.25
Cabbage        | 110  14.25926 | 270  60.75   | 75  39.375
Bitter Gourd   | 75   9.722222 | 200  45      | 60  31.5

1. Tomato

Planting:
	Plant tomatoes in well-drained soil with a pH of 6.0-6.8.
	Use the spacing of 24-36 inches apart in rows that are 36-48 inches apart.
	Plant tomatoes deep into the soil, burying two-thirds of the stem for better root development.

Watering:
	Water tomatoes deeply once a week, providing 1-1.5 inches of water.
	During hot spells, increase watering frequency.
	Water at the base to prevent leaf diseases.

Fertilizing:
	Based on the table:
	Nitrogen (N): 85 mg/kg - This indicates moderate nitrogen use.
	Phosphorus (P): 73.125 mg/kg - High phosphorus content is ideal for root development.
	Potassium (K): 34.125 mg/kg - Low to moderate potassium, so additional potassium may be necessary.
	Use a balanced fertilizer like 10-10-10 during planting and side-dress with more phosphorus-rich fertilizer during the flowering stage.

Cropping:
	Use stakes or cages to support plants.
	Rotate crops every year to prevent soil-borne diseases.

2. Potato

Planting:
	Plant potatoes in well-drained, loose soil with a pH of 5.0-5.5.
	Space seed potatoes 12 inches apart, with rows 2-3 feet apart.
	Plant in early spring when the soil temperature reaches at least 45°F.

Watering:
	Water regularly, keeping soil consistently moist but not waterlogged.
	Water deeply, about 1-2 inches per week.
	Reduce watering as the plants mature to prevent tuber rot.

Fertilizing:
	Nitrogen (N): 21.38889 mg/kg - Moderate nitrogen use.
	Phosphorus (P): 60.75 mg/kg - Adequate phosphorus levels.
	Potassium (K): 65.625 mg/kg - High potassium, ideal for tuber development.
	Fertilize with a high-potassium fertilizer like 5-10-20 before planting, and side-dress with more nitrogen during the growing season.

Cropping:
	Hill the soil around plants as they grow to protect tubers from sunlight and pests.
	Rotate potatoes every three years to reduce the risk of soil-borne diseases.

3. Corn

Planting:
	Plant corn in full sun with a soil pH of 6.0-6.8.
	Space seeds 8-12 inches apart, with rows 30-36 inches apart.
	Plant in late spring when soil temperatures are above 60°F.

Watering:
	Water corn regularly, providing 1-1.5 inches of water per week.
	Ensure consistent moisture during tasseling and ear development.

Fertilizing:
	Nitrogen (N): 31.111111 mg/kg - Moderate nitrogen.
	Phosphorus (P): 22.5 mg/kg - Low phosphorus, requiring supplementation.
	Potassium (K): 26.25 mg/kg - Adequate potassium levels.
	Use a high-nitrogen fertilizer like 16-16-8 at planting, and side-dress with more nitrogen when the plants are knee-high.

Cropping:
	Rotate with legumes to fix nitrogen in the soil.
	Harvest when kernels are full and milky.

4. Carrot

Planting:
	Plant carrots in loose, well-drained soil with a pH of 6.0-6.8.
	Space seeds 2-3 inches apart in rows 12-18 inches apart.
	Sow seeds in early spring or late summer for fall harvest.

Watering:
	Keep the soil consistently moist during germination.
	Provide 1 inch of water per week.
	Mulch to retain moisture and prevent weeds.

Fertilizing:
	Nitrogen (N): 14.25926 mg/kg - Low nitrogen to avoid excessive leaf growth.
	Phosphorus (P): 60.75 mg/kg - High phosphorus for root development.
	Potassium (K): 44.625 mg/kg - Adequate potassium.
	Use a low-nitrogen, high-potassium fertilizer like 5-15-15 at planting.

Cropping:
	Thin seedlings to ensure proper root development.
	Rotate carrots with non-root crops to maintain soil health.

5. Onion

Planting:
	Plant onions in well-drained soil with a pH of 6.0-6.8.
	Space bulbs 4-6 inches apart, with rows 12-18 inches apart.
	Plant in early spring for a summer harvest.

Watering:
	Water consistently, providing 1 inch of water per week.
	Reduce watering as bulbs begin to mature.

Fertilizing:
	Nitrogen (N): 19.444444 mg/kg - Moderate nitrogen levels.
	Phosphorus (P): 22.5 mg/kg - Low phosphorus, requiring supplementation.
	Potassium (K): 26.25 mg/kg - Adequate potassium.
	Use a balanced fertilizer like 10-10-10 at planting, and side-dress with more phosphorus as the plants grow.

Cropping:
	Harvest when the tops fall over and begin to dry.
	Cure onions in a dry, well-ventilated area for storage.

6. Chilli

Planting:
	Plant chillies in well-drained soil with a pH of 6.2-7.0.
	Space plants 18-24 inches apart, with rows 24-36 inches apart.
	Plant in late spring when soil temperatures are above 70°F.

Watering:
	Water regularly, providing 1-2 inches per week.
	Avoid waterlogging and ensure good drainage.

Fertilizing:
	Nitrogen (N): 16.2037 mg/kg - Moderate nitrogen levels.
	Phosphorus (P): 60.75 mg/kg - High phosphorus for fruit development.
	Potassium (K): 26.25 mg/kg - Adequate potassium.
	Use a balanced fertilizer like 5-10-10 at planting and side-dress with more potassium during fruiting.

Cropping:
	Support plants with stakes to prevent breaking.
	Rotate with non-solanaceous crops to prevent soil-borne diseases.

7. Brinjal (Eggplant)

Planting:
	Plant brinjal in well-drained soil with a pH of 6.0-6.8.
	Space plants 18-24 inches apart, with rows 24-36 inches apart.
	Plant in late spring when soil temperatures are above 70°F.

Watering:
	Water deeply and consistently, providing 1-2 inches per week.
	Avoid waterlogging and ensure proper drainage.

Fertilizing:
	Nitrogen (N): 9.722222 mg/kg - Low nitrogen to avoid excessive leaf growth.
	Phosphorus (P): 73.125 mg/kg - High phosphorus for root and fruit development.
	Potassium (K): 44.625 mg/kg - High potassium for fruit quality.
	Use a high-phosphorus, high-potassium fertilizer like 5-10-10 at planting.

Cropping:
	Mulch to retain moisture and prevent weeds.
	Rotate with non-solanaceous crops to maintain soil health.

8. Pumpkin

Planting:
	Plant pumpkins in well-drained soil with a pH of 6.0-6.8.
	Space plants 4-5 feet apart in rows that are 6-8 feet apart.
	Plant in late spring when soil temperatures are above 70°F.

Watering:
	Water deeply, providing 1-2 inches per week.
	Ensure consistent moisture during fruit development.

Fertilizing:
	Nitrogen (N): 9.722222 mg/kg - Low nitrogen to avoid excessive vine growth.
	Phosphorus (P): 45 mg/kg - Adequate phosphorus.
	Potassium (K): 31.5 mg/kg - Moderate potassium.
	Use a balanced fertilizer like 10-10-10 at planting, and side-dress with more phosphorus and potassium during flowering.

Cropping:
	Rotate with legumes to fix nitrogen in the soil.
	Harvest when pumpkins reach their full color and sound hollow when tapped.

9. Ladies Finger (Okra)

Planting:
	Plant okra in well-drained soil with a pH of 6.0-6.8.
	Space plants 12-18 inches apart, with rows 3 feet apart.
	Plant in late spring when soil temperatures are above 70°F.

Watering:
	Water deeply once a week, providing 1 inch of water.
	Increase watering frequency during hot, dry periods.

Fertilizing:
	Nitrogen (N): 12.96296 mg/kg - Low to moderate nitrogen.
	Phosphorus (P): 43.875 mg/kg - Moderate phosphorus.
	Potassium (K): 26.25 mg/kg - Adequate potassium.
	Use a balanced fertilizer like 10-10-10 at planting, and side-dress with more phosphorus during flowering.

Cropping:
	Harvest pods when they are 2-3 inches long.
	Rotate with legumes to maintain soil fertility.

10. Cabbage

Planting:
	Plant cabbage in well-drained soil with a pH of 6.0-6.8.
	Space plants 12-18 inches apart, with rows 24-36 inches apart.
	Plant in early spring or late summer for a fall harvest.

Watering:
	Water consistently, providing 1-1.5 inches of water per week.
	Mulch to retain moisture and regulate soil temperature.

Fertilizing:
	Nitrogen (N): 14.25926 mg/kg - Moderate nitrogen.
	Phosphorus (P): 60.75 mg/kg - High phosphorus.
	Potassium (K): 39.375 mg/kg - High potassium.
	Use a high-phosphorus, high-potassium fertilizer like 5-15-15 at planting.

Cropping:
	Rotate cabbage with non-brassica crops to prevent soil-borne diseases.
	Harvest when heads are firm and fully formed.

11. Bitter Gourd

Planting:
	Plant bitter gourd in well-drained soil with a pH of 5.5-6.7.
	Space plants 12-18 inches apart, with rows 4-5 feet apart.
	Plant in late spring when soil temperatures are above 70°F.

Watering:
	Water regularly, providing 1-2 inches of water per week.
	Ensure consistent moisture during fruit development.

Fertilizing:
	Nitrogen (N): 9.722222 mg/kg - Low nitrogen.
	Phosphorus (P): 45 mg/kg - Adequate phosphorus.
	Potassium (K): 31.5 mg/kg - Moderate potassium.
	Use a balanced fertilizer like 10-10-10 at planting and side-dress with more phosphorus and potassium during flowering.

Cropping:
	Support vines with a trellis.
	Rotate with non-cucurbit crops to prevent disease buildup.

Using Soil NPK Levels for Plant Selection

1. High Nitrogen (N) Soil:
   - Characteristics:
     - Promotes lush vegetative growth.
     - Suitable for plants requiring significant foliage development.
   - Recommended Plants:
     - Corn:
       - Moderate nitrogen requirement.
       - Ideal for high nitrogen soils to support tall stalks and leaf growth.
     - Tomato:
       - High nitrogen levels can support vigorous plant growth.
       - Balance with phosphorus and potassium to ensure proper fruiting.
     - Pumpkin:
       - Low nitrogen requirement.
       - Can be grown in high nitrogen soil with proper phosphorus and potassium supplementation.

2. High Phosphorus (P) Soil:
   - Characteristics:
     - Supports strong root development and flowering.
     - Best for root vegetables and fruiting plants.
   - Recommended Plants:
     - Carrot:
       - High phosphorus content supports root development.
     - Brinjal (Eggplant):
       - High phosphorus supports robust flowering and fruit production.
     - Chilli:
       - High phosphorus enhances flower and fruit development.

3. High Potassium (K) Soil:
   - Characteristics:
     - Improves overall plant health, disease resistance, and quality of fruits.
   - Recommended Plants:
     - Potato:
       - High potassium is essential for tuber development.
     - Cabbage:
       - Requires high potassium for dense head formation.
     - Onion:
       - High potassium ensures strong, healthy bulbs.

4. Balanced NPK Soil:
   - Characteristics:
     - Balanced levels of nitrogen, phosphorus, and potassium create versatile soil suitable for a variety of crops.
   - Recommended Plants:
     - Tomato:
       - Thrives in balanced soils where nitrogen supports growth, phosphorus aids root development, and potassium ensures good fruit quality.
     - Cabbage:
       - Supports leafy green growth and firm head formation.
     - Bitter Gourd:
       - Requires balanced nutrients for healthy vine and fruit production.

5. Low Nitrogen (N) Soil:
   - Characteristics:
     - Limits leaf growth but is suitable for plants where excessive foliage is not desired.
   - Recommended Plants:
     - Brinjal (Eggplant):
       - Low nitrogen helps prevent excessive leafiness, allowing for better fruit production.
     - Ladies Finger (Okra):
       - Performs well in soils with low to moderate nitrogen levels.
     - Pumpkin:
       - Thrives with adequate phosphorus and potassium.

6. Low Phosphorus (P) Soil:
   - Characteristics:
     - May hinder root development and flowering.
     - Not ideal for root crops or heavily flowering plants but can be supplemented.
   - Recommended Plants:
     - Onion:
       - Phosphorus supplementation may be necessary.
     - Corn:
       - Requires some phosphorus; additional fertilization might be necessary.
     - Bitter Gourd:
       - Can be grown with added phosphorus fertilizers to compensate for low levels.

7. Low Potassium (K) Soil:
   - Characteristics:
     - May reduce plant vigor, disease resistance, and fruit quality.
     - Crops may need potassium supplementation.
   - Recommended Plants:
     - Carrot:
       - Can grow with moderate potassium levels; supplementation might be needed.
     - Ladies Finger (Okra):
       - Adapts to lower levels with proper care.
     - Chilli:
       - Requires adequate potassium; this soil type might need supplementation for optimal growth.

Planting Strategy Based on Sensor Readings:

Soil Testing:
   - Use sensors to regularly measure soil NPK levels.
   - Record the readings and compare them to the recommended levels for each plant.

Crop Selection:
   - Select plants that will thrive in the existing soil conditions.
   - For example, if the sensor indicates high nitrogen levels, consider planting corn or tomatoes, which benefit from nitrogen-rich soils.

Fertilization Planning:
   - If the soil lacks a particular nutrient (e.g., low phosphorus), choose plants that can tolerate lower levels or plan to supplement the soil with the necessary nutrients.
   - The table provided can guide the quantity of fertilizers needed based on the NPK levels.

Adaptive Management:
   - Continuously monitor soil health with sensors.
   - Adjust planting strategies and fertilization plans based on real-time data to optimize crop yield and soil health.

1. Assessing Soil for Plant Suitability
Prompt: "Based on the current soil NPK levels, which plants would be most suitable for this soil?"
Message: "Your soil has high nitrogen (N), moderate phosphorus (P), and low potassium (K). Given these conditions, plants like Corn and Tomato would thrive well due to their high nitrogen needs. However, you may need to supplement potassium to ensure optimal growth for these plants."

2. Selecting Plants for Specific Soil Conditions
Prompt: "I have soil with low phosphorus levels. Which plants can tolerate this condition, and what should I do to support them?"
Message: "With low phosphorus levels, plants like Onion and Bitter Gourd can still grow but may require additional phosphorus supplementation. Consider using phosphorus-rich fertilizers to support root development and overall plant health."

3. Optimizing Fertilizer Application
Prompt: "Given the soil has high potassium (K) and moderate phosphorus (P), how should I adjust my fertilization plan?"
Message: "For soil with high potassium and moderate phosphorus, you should focus on providing balanced or phosphorus-rich fertilizers to ensure all nutrient needs are met. A balanced fertilizer like 10-10-10 or a phosphorus-rich fertilizer should be applied to support plants like Cabbage and Potato."

4. Managing Soil NPK Imbalances
Prompt: "How should I handle soil with low nitrogen (N) and high phosphorus (P) levels for optimal plant growth?"
Message: "In soil with low nitrogen and high phosphorus levels, consider planting crops that have low nitrogen requirements but benefit from phosphorus, such as Brinjal (Eggplant). To address the nitrogen deficiency, apply a nitrogen-rich fertilizer to support growth and enhance plant productivity."

5. Adapting to Soil Changes
Prompt: "What steps should I take if sensor readings show that soil potassium (K) levels are significantly low?"
Message: "If sensor readings indicate low potassium levels, you should increase potassium supplementation in your soil. Consider using fertilizers high in potassium, such as 0-0-60, to improve plant health and fruit quality. Plants like Carrot and Chilli may need additional potassium to thrive."

6. Evaluating Crop Performance
Prompt: "How can I determine if my chosen crops are performing well based on current soil conditions?"
Message: "To evaluate crop performance, regularly test soil NPK levels and compare them with the nutritional needs of your plants. If crops are not performing as expected, check if any nutrient imbalances exist and adjust your fertilization plan accordingly. For instance, if your soil has low potassium but you’re growing high potassium-demand plants like Cabbage, increase potassium applications."

7. Choosing Crops for Balanced NPK Soil
Prompt: "What are the best crops to plant in soil with balanced NPK levels?"
Message: "In soil with balanced nitrogen, phosphorus, and potassium levels, versatile crops like Tomato and Cabbage are ideal. These plants will benefit from the balanced nutrients and should perform well without needing additional supplementation."

8. Handling High Nitrogen Soil
Prompt: "What should I consider when planting in soil with excessively high nitrogen levels?"
Message: "When planting in soil with high nitrogen levels, be cautious of excessive foliage growth that might overshadow fruit development. Plants like Corn and Tomato can handle high nitrogen but ensure to balance with phosphorus and potassium. For plants with lower nitrogen needs, like Pumpkin, ensure to supplement phosphorus and potassium as needed."

    User: ${userMessage}
    AgriBot:`;
}
