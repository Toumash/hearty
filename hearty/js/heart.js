// empty
var emptyHeart = document.createElement("emptyHeart");
emptyHeart.src = "../img/empty_heart.png";
var src = document.getElementById("empty");
src.height = 150;
src.width = 150;
src.appendChild(emptyHeart);

// filled
var filledHeart = document.createElement("filledHeart");
filledHeart.src = "../img/filled_heart.png";
var src = document.getElementById("filled");
src.height = 150;
src.width = 150;
src.appendChild(filledHeart);