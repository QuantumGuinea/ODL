var map;
var marker;

function loadKaKaoMap(x = 37.566842224638414, y = 126.97865225753738) {
  var mapContainer = document.getElementById("map"), // 지도를 표시할 div
    mapOption = {
      center: new kakao.maps.LatLng(x, y), // 지도의 중심좌표
      level: 3, // 지도의 확대 레벨
    };

  map = new kakao.maps.Map(mapContainer, mapOption); // 지도를 생성합니다

  // 지도를 클릭한 위치에 표출할 마커입니다
  marker = new kakao.maps.Marker({
    // 지도 중심좌표에 마커를 생성합니다
    position: map.getCenter(),
  });

  // 지도에 클릭 이벤트를 등록합니다
  // 지도를 클릭하면 마지막 파라미터로 넘어온 함수를 호출합니다
  kakao.maps.event.addListener(map, "click", clickEvent);
}

function moveMap(keyword) {
  // 장소 검색 객체를 생성

  var ps = new kakao.maps.services.Places();

  ps.keywordSearch(keyword, function (data, status, pagination) {
    if (status === kakao.maps.services.Status.OK) {
      console.log(data[0].y, data[0].x); // 첫 번째 검색 결과의 위도(y)와 경도(x) 출력

      var newCenter = new kakao.maps.LatLng(data[0].y, data[0].x);

      if (map) {
        map.setCenter(newCenter); // 기존 map의 중심만 변경
      } else {
        loadKaKaoMap(data[0].y, data[0].x);
      }
    } else {
      console.log("검색 실패:", status);
    }
  });
}

function clickEvent(mouseEvent) {
  // 지도에 마커를 표시합니다
  marker.setMap(map);
  // 클릭한 위도, 경도 정보를 가져옵니다
  var latlng = mouseEvent.latLng;

  // 마커 위치를 클릭한 위치로 옮깁니다
  marker.setPosition(latlng);

  // 클릭한 위치의 위도와 경도 정보를 객체로 저장하여 전역 객체인 window에 저장
  window.selectedLatlng = {
    lat: latlng.getLat(), // 위도 값 저장
    lng: latlng.getLng(), // 경도 값 저장
  };

  var message = "클릭한 위치의 위도는 " + latlng.getLat() + " 이고, ";
  message += "경도는 " + latlng.getLng() + " 입니다";

  var resultDiv = document.getElementById("clickLatlng");
  resultDiv.innerHTML = message;
}

document.getElementById("searchButton").addEventListener("click", function () {
  // 입력된 키워드 가져오기
  var keyword = document.getElementById("keywordInput").value;
  // moveMap 함수 실행
  moveMap(keyword);
});

loadKaKaoMap();
