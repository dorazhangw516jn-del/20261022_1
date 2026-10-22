// ==========================================
// 幼兒園生活常識 - 全畫布拖曳測驗系統 (免聯網、不怕卡讀取版)
// ==========================================

// --- 題目與代表顏色/圖示設定 ---
const questions = [
  { id: 0, text: '飯前飯後要洗手', label: '🧼 洗手', color: [100, 200, 255] },
  { id: 1, text: '過馬路看紅綠燈', label: '🚦 紅綠燈', color: [255, 100, 100] },
  { id: 2, text: '早晚認真刷牙', label: '🦷 刷牙', color: [255, 220, 100] },
  { id: 3, text: '看到老師說你好', label: '👋 打招呼', color: [150, 250, 150] },
  { id: 4, text: '玩具玩完要收好', label: '🧸 收玩具', color: [220, 150, 250] },
  { id: 5, text: '打噴嚏用紙巾遮', label: '🤧 遮口鼻', color: [250, 180, 100] }
];

let dropZones = [];      
let draggableCards = [];  
let particles = [];      

let UI = {
  headerH: 100,          
  imgH: 140,             
  zoneH: 220,            
  cardW: 180,            
  cardH: 60,             
  padding: 20,           
  submitBtnY: 0          
};

let draggingCard = null;  
let dragOffsetX = 0;      
let dragOffsetY = 0;
let isSubmitted = false;  
let finalScore = 0;       
let showSubmitBtn = false; 

// 不需要 preload()，直接在 setup 建立
function setup() {
  createCanvas(windowWidth, windowHeight);
  initGameElements();
  
  textFont('Microsoft JhengHei', 22);
  textAlign(CENTER, CENTER);
  rectMode(CENTER);
  imageMode(CENTER);
}

function draw() {
  background(240, 248, 255);
  updateAndDrawParticles();

  drawHeader();

  for (let zone of dropZones) {
    zone.display();
  }

  for (let card of draggableCards) {
    if (card !== draggingCard) {
      card.display();
    }
  }

  if (draggingCard) {
    draggingCard.x = mouseX + dragOffsetX;
    draggingCard.y = mouseY + dragOffsetY;
    draggingCard.display();
  }

  checkGameStatus();
  drawUIButtonsAndScore();
}

// --- 上方目標放置區類別 (改用可愛彩色卡片代替圖片) ---
class DropZone {
  constructor(x, y, w, h, data, id) {
    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.data = data;
    this.id = id;
    this.occupiedCard = null;
    this.status = 'normal';
  }

  display() {
    push();
    translate(this.x, this.y);
    
    // 繪製上方圖示方塊
    let topBoxY = -UI.zoneH/2 + UI.imgH/2 + UI.padding;
    noStroke();
    fill(this.data.color);
    rect(0, topBoxY, UI.imgH, UI.imgH, 20);
    
    fill(50);
    textSize(24);
    text(this.data.label, 0, topBoxY);

    // 繪製下方吸附框
    let slotY = UI.zoneH/2 - UI.cardH/2 - UI.padding;
    
    strokeWeight(3);
    if (!isSubmitted) {
      if (this.occupiedCard) {
        stroke(78, 205, 196);
        fill(255);
      } else {
        stroke(180);
        drawingContext.setLineDash([6, 6]);
        fill(245);
      }
    } else {
      drawingContext.setLineDash([]); 
      if (this.status === 'correct') {
        stroke(76, 175, 80);
        fill(230, 245, 230);
      } else {
        stroke(244, 67, 54);
        fill(255, 235, 235);
      }
    }
    
    rect(0, slotY, UI.cardW, UI.cardH, 12);
    drawingContext.setLineDash([]);
    
    pop();
  }

  getSlotPos() {
    return {
      x: this.x,
      y: this.y + UI.zoneH/2 - UI.cardH/2 - UI.padding
    };
  }
}

class DraggableCard {
  constructor(x, y, text, id) {
    this.startX = x;
    this.startY = y;
    this.x = x;
    this.y = y;
    this.text = text;
    this.id = id;
    this.w = UI.cardW;
    this.h = UI.cardH;
    this.isPlaced = false;
  }

  display() {
    push();
    translate(this.x, this.y);
    
    noStroke();
    fill(0, 30);
    rect(4, 4, this.w, this.h, 20);

    if (isSubmitted) {
      fill(220);
    } else if (this === draggingCard) {
      fill(255, 210, 80);
    } else {
      fill(255, 230, 109);
    }
    
    stroke(255, 140, 0);
    strokeWeight(2.5);
    rect(0, 0, this.w, this.h, 20);

    noStroke();
    fill(40);
    textSize(20);
    text(this.text, 0, 0);
    
    pop();
  }

  isMouseOver() {
    return (mouseX > this.x - this.w/2 && mouseX < this.x + this.w/2 &&
            mouseY > this.y - this.h/2 && mouseY < this.y + this.h/2);
  }
}

function initGameElements() {
  dropZones = [];
  draggableCards = [];
  
  let totalW = min(windowWidth * 0.95, 1250);
  let startX = (windowWidth - totalW) / 2;
  let cols = min(6, floor(totalW / (UI.cardW + UI.padding)));
  
  let shuffledQs = shuffle([...questions]);
  for (let i = 0; i < shuffledQs.length; i++) {
    let col = i % cols;
    let row = floor(i / cols);
    let zoneW = totalW / cols;
    
    let x = startX + col * zoneW + zoneW / 2;
    let y = UI.headerH + row * (UI.zoneH + UI.padding) + UI.zoneH / 2;
    
    dropZones.push(new DropZone(x, y, zoneW, UI.zoneH, shuffledQs[i], shuffledQs[i].id));
  }

  let lastZone = dropZones[dropZones.length - 1];
  let optionsY = lastZone.y + UI.zoneH / 2 + UI.padding * 2;
  UI.submitBtnY = optionsY + (UI.cardH + UI.padding) * 2 + 30;

  let shuffledOptions = shuffle([...questions]);
  let optCols = min(6, floor(totalW / (UI.cardW + UI.padding)));
  let optStartX = (windowWidth - optCols * (UI.cardW + UI.padding)) / 2;

  for (let i = 0; i < shuffledOptions.length; i++) {
    let col = i % optCols;
    let row = floor(i / optCols);
    
    let x = optStartX + col * (UI.cardW + UI.padding) + UI.cardW / 2;
    let y = optionsY + row * (UI.cardH + UI.padding) + UI.cardH / 2;
    
    draggableCards.push(new DraggableCard(x, y, shuffledOptions[i].text, shuffledOptions[i].id));
  }
}

function drawHeader() {
  push();
  fill(255, 107, 107);
  textSize(36);
  textStyle(BOLD);
  text('🌟 幼兒園生活常識配對王 🌟', windowWidth / 2, 35);
  
  fill(80);
  textSize(20);
  textStyle(NORMAL);
  text('請把下方的文字卡片，拖曳到上方正確的圖示下方吧！', windowWidth / 2, 75);
  pop();
}

function checkGameStatus() {
  if (isSubmitted) return;
  let allPlaced = true;
  for (let zone of dropZones) {
    if (!zone.occupiedCard) {
      allPlaced = false;
      break;
    }
  }
  showSubmitBtn = allPlaced;
}

function drawUIButtonsAndScore() {
  push();
  translate(windowWidth/2, UI.submitBtnY);
  
  if (!isSubmitted) {
    if (showSubmitBtn) {
      let btnW = 240;
      let btnH = 70;
      
      if (mouseX > windowWidth/2 - btnW/2 && mouseX < windowWidth/2 + btnW/2 &&
          mouseY > UI.submitBtnY - btnH/2 && mouseY < UI.submitBtnY + btnH/2) {
        fill(255, 120, 120);
        cursor(HAND);
      } else {
        fill(255, 90, 90);
        cursor(ARROW);
      }
      
      noStroke();
      rect(0, 0, btnW, btnH, 35);
      
      fill(255);
      textSize(26);
      textStyle(BOLD);
      text('交卷看成績 📝', 0, 0);
    }
  } else {
    let boardW = 450;
    let boardH = 110;
    
    fill(255);
    stroke(50);
    strokeWeight(2);
    rect(0, 0, boardW, boardH, 20);
    
    noStroke();
    textSize(30);
    textStyle(BOLD);
    
    if (finalScore >= 80) {
      fill(76, 175, 80);
      text(`🎉 太棒了！獲得 ${finalScore} 分！`, 0, 0);
    } else {
      fill(244, 67, 54);
      text(`💪 獲得 ${finalScore} 分！再接再厲！`, 0, 0);
    }
    
    cursor(ARROW);
  }
  pop();
}

function calculateScore() {
  let correctCount = 0;
  for (let zone of dropZones) {
    if (zone.occupiedCard && zone.occupiedCard.id === zone.id) {
      correctCount++;
      zone.status = 'correct';
    } else {
      zone.status = 'wrong';
    }
  }
  
  finalScore = Math.round((correctCount / questions.length) * 100);
  isSubmitted = true;
  
  if (finalScore >= 80) {
    createParticles();
  }
}

function mousePressed() {
  if (isSubmitted) return;

  if (showSubmitBtn) {
    let btnW = 240;
    let btnH = 70;
    if (mouseX > windowWidth/2 - btnW/2 && mouseX < windowWidth/2 + btnW/2 &&
        mouseY > UI.submitBtnY - btnH/2 && mouseY < UI.submitBtnY + btnH/2) {
      calculateScore();
      return;
    }
  }

  for (let i = draggableCards.length - 1; i >= 0; i--) {
    if (draggableCards[i].isMouseOver()) {
      draggingCard = draggableCards[i];
      dragOffsetX = draggingCard.x - mouseX;
      dragOffsetY = draggingCard.y - mouseY;
      
      for (let zone of dropZones) {
        if (zone.occupiedCard === draggingCard) {
          zone.occupiedCard = null;
          draggingCard.isPlaced = false;
        }
      }
      break; 
    }
  }
}

function mouseReleased() {
  if (!draggingCard) return;

  let placed = false;
  for (let zone of dropZones) {
    let slot = zone.getSlotPos();
    let d = dist(draggingCard.x, draggingCard.y, slot.x, slot.y);
    
    if (d < UI.cardW/2) {
      if (zone.occupiedCard) {
        zone.occupiedCard.x = zone.occupiedCard.startX;
        zone.occupiedCard.y = zone.occupiedCard.startY;
        zone.occupiedCard.isPlaced = false;
      }
      
      zone.occupiedCard = draggingCard;
      draggingCard.x = slot.x;
      draggingCard.y = slot.y;
      draggingCard.isPlaced = true;
      placed = true;
      break;
    }
  }

  if (!placed) {
    draggingCard.x = draggingCard.startX;
    draggingCard.y = draggingCard.startY;
    draggingCard.isPlaced = false;
  }

  draggingCard = null;
}

function touchStarted() {
  mousePressed();
  return false;
}

function touchEnded() {
  mouseReleased();
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  initGameElements();
}

function createParticles() {
  particles = [];
  for (let i = 0; i < 200; i++) {
    particles.push({
      x: random(width),
      y: random(-height, 0),
      size: random(12, 22),
      color: color(random(255), random(255), random(255)),
      speedY: random(3, 8),
      speedX: random(-2, 2),
      rotation: random(TWO_PI),
      spin: random(-0.1, 0.1)
    });
  }
}

function updateAndDrawParticles() {
  if (!isSubmitted || finalScore < 80) return;
  
  noStroke();
  for (let p of particles) {
    fill(p.color);
    push();
    translate(p.x, p.y);
    rotate(p.rotation);
    rect(0, 0, p.size, p.size / 2);
    pop();
    
    p.y += p.speedY;
    p.x += p.speedX;
    p.rotation += p.spin;
    
    if (p.y > height) {
      p.y = -50;
      p.x = random(width);
    }
  }
}