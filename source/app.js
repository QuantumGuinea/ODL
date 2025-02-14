import { SERVICE_KEY } from "./config.js";
import { TOUR_TYPE } from "./constant.js";

const LIST_API_URL =
  "https://apis.data.go.kr/B551011/KorPetTourService/locationBasedList";
const DETAIL_API_URL =
  "https://apis.data.go.kr/B551011/KorPetTourService/detailPetTour";

// 📌 장소 목록 조회
async function fetchBaseList(tourValue) {
  //console.log(window.selectedLatlng.lng);
  //console.log(window.selectedLatlng.lat);

  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(SERVICE_KEY),
    numOfRows: 20,
    pageNo: 1,
    MobileOS: "ETC",
    MobileApp: "AppTest",
    arrange: "C",
    listYN: "Y",
    contentTypeId: tourValue,
    mapX: window.selectedLatlng.lng,
    mapY: window.selectedLatlng.lat,
    radius: 10000,
    _type: "json",
  });

  try {
    const response = await fetch(`${LIST_API_URL}?${params}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();

    // contentid만 추출하여 배열로 반환
    console.log(data);
    return data;
  } catch (error) {
    console.error("Error fetching content IDs:", error);
    return [];
  }
}

// 📌 개별 API 호출 (각 contentid에 대해 호출)
async function fetchDetail(contentId) {
  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(SERVICE_KEY),
    numOfRows: 10,
    pageNo: 1,
    MobileOS: "ETC",
    MobileApp: "AppTest",
    contentId: contentId,
    _type: "json",
  });

  try {
    const response = await fetch(`${DETAIL_API_URL}?${params}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();
    return data.response.body.items.item; // 상세 정보 반환
  } catch (error) {
    console.error(`Error fetching details for contentId ${contentId}:`, error);
    return null;
  }
}

function getSelectedTourValue() {
  const selectedTour = document.querySelector('input[name="tour"]:checked');
  return selectedTour ? selectedTour.value : null;
}

// 📌 모든 API 호출 실행
async function fetchAllDetails() {
  // 관광 카테고리
  const tourValue = getSelectedTourValue();
  console.log(tourValue + "\n");

  // 장소 기본 정보
  if (!window.selectedLatlng?.lng || !window.selectedLatlng?.lat) {
    // 하나라도 falsy한 값일 경우
    alert("지도에 마커를 표시해 주세요!");
    return;
  }
  const data = await fetchBaseList(tourValue);

  // 만약에 data가 없다면 종료
  if (data.response.body.totalCount === 0) {
    console.log("주위의 정보 없음", data);

    const resultDiv = document.getElementById("result");
    const div = document.createElement("div");

    // 조회된 관광/숙소가 없음
    const message = document.createElement("p");
    message.textContent = "조회된 관광/숙소가 없음";
    div.appendChild(message);

    // resultDiv 안에 추가
    resultDiv.appendChild(div);

    return;
  }

  // contentid 배열 가져오기
  const contentIds = data.response.body.items.item.map(
    (item) => item.contentid
  );
  console.log("📌 가져온 contentId 목록:", contentIds);

  if (contentIds.length === 0) {
    console.error("📌 contentId가 없습니다.");
    return;
  }

  // Promise.all()로 모든 API 호출 실행
  const detailsArray = await Promise.all(contentIds.map(fetchDetail));

  console.log(detailsArray);
  // 📌 배열 내부 구조 확인 후 문자열 변환
  const detailsString = detailsArray
    .map((detail, index) => {
      if (!detail || !Array.isArray(detail) || detail.length === 0) return null;
      const item = detail[0]; // 첫 번째 요소 가져오기

      // 장소의 속성 정리
      Object.keys(item).forEach((key) => {
        if (typeof item[key] === "string") {
          item[key] = item[key].replace(/[-\s]+/g, " ").trim();
        }
      });

      return `${index}번 사고 예방 및 응급 조치 관련 정보: ${item.relaAcdntRiskMtr}, 반려동물 동반 가능 구역 정보: ${item.acmpyTypeCd}, 관련 시설: ${item.relaPosesFclty}, 제공되는 반려동물 관련 용품: ${item.relaFrnshPrdlst}, 기타 동반 정보: ${item.etcAcmpyInfo}, 구매 가능한 제품 목록: ${item.relaPurcPrdlst}, 동반 가능한 반려견 기준: ${item.acmpyPsblCpam}, 대여 관련 제품 목록: ${item.relaRntlPrdlst}, 필수 동반 조건: ${item.acmpyNeedMtr}`;
    })
    .filter((item) => item !== null) // null 값 제거
    .join("\n"); // 줄바꿈으로 연결

  // pet 정보
  const petInfo = document.getElementById("petInfo").value.trim();
  // prompt
  const prompt =
    "숙소 정보:\n" + detailsString + "\n반려동물 정보:\n" + petInfo;
  console.log("📌 숙소 정보, 펫 정보:\n", prompt);

  // gemini에게 물어봅시다..
  const url = `http://localhost:3000/gemini?type=${tourValue}`;
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify({
      text: prompt,
    }),
    // Content-Type 꼭!
    headers: {
      "Content-Type": "Application/json",
    },
  });
  const json = await response.json();
  let numbers = json.reply;

  // 화면에 보여주는 함수
  displayInfo(numbers, data);
}

function displayInfo(numbers, data) {
  const resultDiv = document.getElementById("result");

  // 조건에 부합되는 관광/숙소가 없다면
  if (numbers.length === 0) {
    console.log("반려 동물 정보에 맞는 관광/숙소가 없음", numbers);
    const div = document.createElement("div");

    // 반려 동물 정보에 맞는 관광/숙소가 없음
    const message = document.createElement("p");
    message.textContent = "반려 동물 정보에 맞는 관광/숙소가 없음";
    div.appendChild(message);

    // resultDiv 안에 추가
    resultDiv.appendChild(div);

    return;
  }

  // data.response.body.items.item 배열에서 각 숙소의 정보 출력
  for (const [index, num] of numbers.entries()) {
    const item = data.response.body.items.item[num]; // 번호에 맞는 숙소 정보

    const div = document.createElement("div");
    div.id = `숙소-${index}`; // 인덱스를 기반으로 id 설정

    // 숙소 이름
    const title = document.createElement("h3");
    title.textContent = item.title;
    div.appendChild(title);

    // 숙소 주소
    const address = document.createElement("p");
    address.textContent = `주소: ${item.addr1} ${item.addr2}`;
    div.appendChild(address);

    // 숙소 이미지 (없으면 대체 이미지 설정)
    const image = document.createElement("img");
    if (item.firstimage) {
      image.src = item.firstimage;
    } else {
      image.src = "https://placehold.co/437x291.png"; // 기본 이미지 경로
    }
    image.alt = item.title;
    image.style.width = "50%"; // 이미지 크기 조절
    div.appendChild(image);

    // 전화번호
    const tel = document.createElement("p");
    tel.textContent = `전화번호: ${item.tel}`;
    div.appendChild(tel);

    // 숙소 링크 (필요시 추가)
    const link = document.createElement("a");
    link.href = `http://tour.visitkorea.or.kr/${item.contentid}`;
    link.target = "_blank";
    link.textContent = "상세보기";
    div.appendChild(link);

    resultDiv.appendChild(div);
  }
}

document
  .getElementById("fetchButton")
  .addEventListener("click", fetchAllDetails);
