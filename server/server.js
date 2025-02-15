require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();
const { TOUR_TYPE } = require("../source/constant");

// 미들웨어 설정
app.use(express.json());
app.use(
  cors({
    origin: "http://127.0.0.1:5500",
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  })
);

async function makeReply(text, type) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
  const typeText = TOUR_TYPE[type];

  // console.log("type", type, "\n");
  // console.log("type", typeText, "\n");
  const response = await axios({
    url,
    method: "POST",
    data: {
      contents: [
        {
          parts: [
            {
              text: `${typeText} 정보와 반려동물 정보를 분석하여, 해당 동물이 방문 가능한 ${typeText}들의 번호와 특징을 제공해주세요.

              ### Instruction ###
              당신은 RTF(Return To Filter) 분석 엔진입니다. 제공된 정보를 바탕으로 방문 가능한 ${typeText}들을 분석하고, 번호와 함께 구조화된 정보를 반환해야 합니다.
              
              ### Rules ###
              1. ${typeText}의 반려동물 정책과 주어진 반려동물 정보를 비교하세요
              2. 모든 조건을 만족하는 ${typeText}만 선택하세요
              3. ${typeText} 번호는 오름차순으로 정렬하세요
              4. 각 정보는 명확한 구분자로 분리하세요:
                - NUMBER=장소 번호
                - INFO=주요 특징 (다음 내용 포함)
                  * 시설의 물리적 특징 (규모, 구조, 설계 특징)
                  * 역사적/문화적 의미
                  * 주요 볼거리와 즐길거리
                  * 독특한 특징이나 기록
                  * 계절별 특징이나 변화
                - TIME=운영 시간 (계절별, 주간/야간 구분)
              5. 조건을 만족하는 최대 5개의 ${typeText}만 반환하세요.
              6. 조건을 만족하는 번호가 없을 경우 [-1]을 반환하세요
              
              ### Output Format ###
                [
                    {
                        "NUMBER": 1,
                        "INFO": "주요 특징",
                        "TIME": "운영 시간"
                    },
                    {
                        "NUMBER": 2,
                        "INFO": "주요 특징",
                        "TIME": "운영 시간"
                    },
                ]
              
              또는
              
              [-1]
  
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
  const type = req.query.type; // 쿼리스트링에서 type 값을 가져옴
  const { text } = req.body;

  try {
    const reply = await makeReply(text, type);

    const infoList = reply.split("```")[1].split("json")[1];
    console.log(infoList);
    if (JSON.parse(infoList)[0] === -1) {
      console.log("가능한 관광/숙소가 존재하지 않음");
    }

    res.json({ reply: infoList });
  } catch (error) {
    res.status(500).json({ error: error.message });
    console.log(error);
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server is running on port ${PORT}`);
});
