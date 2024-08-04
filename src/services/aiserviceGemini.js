require("dotenv").config();
const { GoogleGenerativeAI } = require("@google/generative-ai");


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const generateQuestionsFromAI_Gemini = async (text) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const prompt = `Generate 3 multiple-choice questions based on the following text. Each question should have 4 options. Format your response as a JSON array of question objects, where each object has properties: question, options (an array of 4 strings), and answer (a string matching one of the options).

    Text: ${text}

    Example format:
    [
      {
        "question": "What is the capital of France?",
        "options": ["London", "Berlin", "Paris", "Madrid"],
        "answer": "Paris"
      }
    ]`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const generatedText = response.text();

    console.log("Gemini response:", generatedText);

    const questions = JSON.parse(generatedText);
    return questions;
  } catch (error) {
    console.error("Error in generateQuestionsFromAI:", error);
    throw error;
  }
};

module.exports = {
  generateQuestionsFromAI_Gemini,
};
