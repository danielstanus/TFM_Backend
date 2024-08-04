require("dotenv").config();
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateQuestionsFromAI_OpenAI = async (text) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates multiple-choice questions based on given text. Generate 3 questions with 4 options each. Format your response as a JSON array of question objects.",
        },
        {
          role: "user",
          content: `Generate multiple-choice questions for the following text: ${text}`,
        },
      ],
      temperature: 0.7,
    });

    const questions = JSON.parse(response.choices[0].message.content);
    return questions;
  } catch (error) {
    console.error("Error in generateQuestionsFromAI:", error);
    if (error.type === "insufficient_quota") {
      // Devuelve un conjunto de preguntas predefinidas o un mensaje de error amigable
      return [
        {
          question:
            "Lo sentimos, no podemos generar preguntas en este momento. Por favor, inténtalo más tarde.",
          options: ["Ok", "Entendido", "Gracias", "Volveré más tarde"],
          answer: "Ok",
        },
      ];
    }
    throw error;
  }
};

module.exports = {
    generateQuestionsFromAI_OpenAI,
};
