const config = require("./config.json");

const LIST_API_URL =
  "https://apis.data.go.kr/B551011/KorPetTourService/locationBasedList";
const DETAIL_API_URL =
  "https://apis.data.go.kr/B551011/KorPetTourService/detailPetTour";
const SERVICE_KEY = "API_KEY";
//encoding key

// 📌 목록 조회 (contentid 배열 가져오기)
async function fetchContentIds() {
  //console.log(window.selectedLatlng.lng);
  //console.log(window.selectedLatlng.lat);

  const params = new URLSearchParams({
    serviceKey: decodeURIComponent(SERVICE_KEY),
    numOfRows: 10,
    pageNo: 1,
    MobileOS: "ETC",
    MobileApp: "AppTest",
    arrange: "C",
    listYN: "Y",
    contentTypeId: 12,
    mapX: window.selectedLatlng.lng,
    mapY: window.selectedLatlng.lat,
    radius: 4000,
    _type: "json",
  });

  try {
    const response = await fetch(`${LIST_API_URL}?${params}`);
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    const data = await response.json();

    // contentid만 추출하여 배열로 반환
    console.log(data);
    return data.response.body.items.item.map((item) => item.contentid);
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

// 📌 모든 API 호출 실행
async function fetchAllDetails() {
  const contentIds = await fetchContentIds();
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

      return `${index + 1}번 필수사항: ${item.acmpyNeedMtr}, 가능 여부: ${
        item.acmpyPsblCpam
      }, 기타 정보: ${item.etcAcmpyInfo}`;
    })
    .filter((item) => item !== null) // null 값 제거
    .join("\n"); // 줄바꿈으로 연결

  console.log("📌 최종 문자열:\n", detailsString);
}

// fetchAllDetails();
document
  .getElementById("fetchButton")
  .addEventListener("click", fetchAllDetails);
