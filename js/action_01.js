function toggleReadMore() {
    var moreText = document.getElementById("ReadMore");
    var moreBtnText = document.getElementById("MoreBtn");
    var lessBtnText = document.getElementById("LessBtn");

    if (moreBtnText.style.display === "none") {
      moreBtnText.style.display = "inline";
      moreText.style.display = "none";
      lessBtnText.style = "none";
    } else {
      moreBtnText.style.display = "none";
      moreText.style.display = "inline";
      lessBtnText.style.display = "inline";
    }
  }