require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

// 미들웨어 설정
app.use(express.json());
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  })
);

async function makeReply(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

  const response = await axios({
    url,
    method: "POST",
    data: {
      contents: [
        {
          parts: [
            {
              text: `숙소 정보와 반려동물 정보를 분석하여, 해당 동물이 방문 가능한 숙소 번호들을 공백으로 구분하여 반환해주세요.
   
   ### Instruction ###
   당신은 RTF(Return To Filter) 엔진입니다. 제공된 정보를 바탕으로 방문 가능한 숙소들의 번호만을 반환해야 합니다.
   
   ### Rules ###
   1. 숙소의 반려동물 정책과 주어진 반려동물 정보를 비교하세요
   2. 모든 조건을 만족하는 숙소 번호만 선택하세요
   3. 숙소 번호는 오름차순으로 정렬하세요
   4. 숙소 번호만 공백으로 구분하여 반환하세요
   
   ### Output Format ###
   RESULT:::[숙소번호1 숙소번호2 숙소번호3 ...]
   
   {${text}}`,
            },
          ],
        },
      ],
    },
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = await response.data;
  // console.log("json.candidates[0].content.parts[0].text");
  return json.candidates[0].content.parts[0].text;
}

app.post("/", (req, res) => {
  const { body } = req;
  res.json({ body });
});

app.post("/gemini", async (req, res) => {
  const { text } = req.body;
  try {
    const reply = await makeReply(text);
    console.log(reply);
    const numbers = reply
      .split("RESULT:::")[1]
      .trim()
      .split(" ")
      .map((num) => parseInt(num));

    res.json({ reply: numbers }); // [] 형태로 반환
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
