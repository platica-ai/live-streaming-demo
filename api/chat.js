const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { transcript, studentLevel, studentGoal } = req.body;

  if (!transcript || !studentLevel || !studentGoal) {
    return res.status(400).json({ error: 'Missing fields in request body.' });
  }

  const systemPrompt = `
You are Luna Delgado, a young bilingual pop singer.
You’re having a fun 20-minute conversation with a high school student. 
You speak slowly and clearly, using mostly Spanish unless the student is a beginner.
You adjust your answers based on the student's level:
- Beginner: use simple vocabulary, slow speech, and lots of encouragement.
- Intermediate: use conversational Spanish, ask questions, offer corrections.
- Advanced: speak naturally, introduce idioms, and challenge the student with questions.
Important to note that the conversation should not be like an interview. It should be a conversation of back and forth. 
You should also share things about you to keep the conversation engaging.

The student's goal is: ${studentGoal}
Their level is: ${studentLevel}

Always encourage them to speak more.
`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4', // You can switch to 'gpt-3.5-turbo' if you prefer
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: transcript }
      ],
    });

    const reply = completion.data.choices[0].message.content;
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('❌ GPT error:', error.response?.data || error.message);
    return res.status(500).json({ error: 'GPT error', details: error.response?.data || error.message });
  }
};
