// ============================================================
// First Encounter Dialogs — 야생 몬스터 첫 만남 대사 (24종)
// ============================================================
// Each value is a function(img) → dialog lines with effects
// img = enemy sprite image path (passed at runtime)

const cx = 240, cy = 280; // center stage position for monster sprite

export const ENCOUNTER_DIALOGS = {
  howl_wolf: (img) => [
    { text: '어둠 속에서 낮고 긴 울음소리가 들린다...', effects: [
      { type: 'bg', preset: 'night', dur: 600 },
      { type: 'tint', color: 0x2222aa, alpha: 0.2, dur: 800 },
    ]},
    { text: '달빛 아래, 울부짖는 늑대가 모습을 드러냈다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 60, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 500 },
      { type: 'move', target: 'mon', fromY: cy + 60, toY: cy, dur: 600, ease: 'easeOut' },
      { type: 'flash', color: 0xccccff, dur: 200 },
    ]},
    { text: '음파가 공기를 가르며 주변을 울린다.', effects: [
      { type: 'shake', dur: 400, intensity: 5 },
      { type: 'bounce', target: 'mon', height: 15, dur: 500 },
    ]},
  ],
  ember_salamander: (img) => [
    { text: '땅에서 열기가 솟아오른다...', effects: [
      { type: 'bg', preset: 'lava', dur: 600 },
      { type: 'tint', color: 0xff4400, alpha: 0.15, dur: 800 },
    ]},
    { text: '용암 도롱뇽이 불꽃을 일렁이며 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 80, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 400 },
      { type: 'move', target: 'mon', fromY: cy + 80, toY: cy, dur: 700, ease: 'easeOut' },
      { type: 'flash', color: 0xff6600, dur: 250 },
    ]},
    { text: '뜨거운 몸에서 아지랑이가 피어오른다.', effects: [
      { type: 'shake', dur: 300, intensity: 3 },
    ]},
  ],
  rot_toad: (img) => [
    { text: '코를 찌르는 독한 냄새가 퍼진다...', effects: [
      { type: 'bg', preset: 'swamp', dur: 600 },
      { type: 'tint', color: 0x44aa00, alpha: 0.15, dur: 800 },
    ]},
    { text: '썩은향 두꺼비가 느릿느릿 모습을 드러냈다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 40, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 600 },
      { type: 'move', target: 'mon', fromY: cy + 40, toY: cy, dur: 800, ease: 'easeOut' },
    ]},
    { text: '거대한 몸에서 뿜어지는 악취가 주변을 뒤덮는다.', effects: [
      { type: 'shake', dur: 300, intensity: 4 },
      { type: 'zoom', target: 'mon', from: 1, to: 1.1, dur: 400 },
    ]},
  ],
  stalker_mantis: (img) => [
    { text: '풀잎이 스르륵... 소리 없이 흔들린다.', effects: [
      { type: 'bg', preset: 'shadow', dur: 600 },
      { type: 'tint', color: 0x003322, alpha: 0.2, dur: 600 },
    ]},
    { text: '그림자 사마귀가 어느새 바로 앞에 서 있다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 200 },
      { type: 'flash', color: 0xffffff, dur: 150 },
      { type: 'shake', dur: 200, intensity: 6 },
    ]},
    { text: '거대한 앞다리가 번뜩이며 빛을 반사한다.', effects: [
      { type: 'bounce', target: 'mon', height: 10, dur: 400 },
    ]},
  ],
  echo_bat: (img) => [
    { text: '동굴 깊은 곳에서 날카로운 초음파가 울린다...', effects: [
      { type: 'bg', preset: 'cave', dur: 600 },
      { type: 'tint', color: 0x220044, alpha: 0.2, dur: 800 },
      { type: 'shake', dur: 200, intensity: 3 },
    ]},
    { text: '초음파 박쥐가 천장에서 내려왔다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy - 80, size: 130, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 400 },
      { type: 'move', target: 'mon', fromY: cy - 80, toY: cy, dur: 500, ease: 'bounce' },
    ]},
    { text: '거대한 날개가 공기를 가르며 펄럭인다.', effects: [
      { type: 'bounce', target: 'mon', height: 20, dur: 500 },
    ]},
  ],
  frost_moth: (img) => [
    { text: '공기가 차갑게 변하고, 눈꽃이 흩날린다...', effects: [
      { type: 'bg', preset: 'ice', dur: 600 },
      { type: 'tint', color: 0x88ccff, alpha: 0.15, dur: 800 },
    ]},
    { text: '서리 나방이 투명한 날개를 펼치며 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 130, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 0.9, dur: 600 },
      { type: 'zoom', target: 'mon', from: 0.5, to: 1, dur: 500 },
    ]},
    { text: '날개에 내려앉은 서리가 빛나고 있다.', effects: [
      { type: 'flash', color: 0xccddff, dur: 300 },
    ]},
  ],
  mist_jellyfish: (img) => [
    { text: '시야가 뿌옇게 흐려진다...', effects: [
      { type: 'bg', preset: 'fog', dur: 600 },
      { type: 'tint', color: 0xaabbcc, alpha: 0.25, dur: 800 },
    ]},
    { text: '안개 해파리가 공중에 유유히 떠 있다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 30, size: 130, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 0.85, dur: 700 },
      { type: 'move', target: 'mon', fromY: cy + 30, toY: cy - 10, dur: 800, ease: 'easeInOut' },
    ]},
    { text: '촉수에서 차가운 안개가 흘러내린다.', effects: [
      { type: 'bounce', target: 'mon', height: 12, dur: 600 },
    ]},
  ],
  vine_spider: (img) => [
    { text: '발밑에서 덩굴이 꿈틀거린다...', effects: [
      { type: 'bg', preset: 'forest', dur: 600 },
      { type: 'tint', color: 0x224400, alpha: 0.2, dur: 600 },
      { type: 'shake', dur: 300, intensity: 3 },
    ]},
    { text: '덩굴 거미가 거미줄 사이에서 모습을 드러냈다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy - 60, size: 130, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 400 },
      { type: 'move', target: 'mon', fromY: cy - 60, toY: cy, dur: 500, ease: 'bounce' },
    ]},
    { text: '냄새나는 덩굴이 사방으로 뻗어 있다.', effects: [] },
  ],
  mirror_chameleon: (img) => [
    { text: '주변 풍경이 살짝 일그러진다...', effects: [
      { type: 'bg', preset: 'twilight', dur: 600 },
      { type: 'flash', color: 0xffffff, dur: 400 },
    ]},
    { text: '거울 카멜레온이 투명함을 풀며 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 130, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 800 },
    ]},
    { text: '호기심 가득한 눈이 이쪽을 관찰하고 있다.', effects: [
      { type: 'zoom', target: 'mon', from: 1, to: 1.15, dur: 400 },
    ]},
  ],
  crystal_stag: (img) => [
    { text: '맑은 종소리 같은 울림이 숲에 퍼진다...', effects: [
      { type: 'bg', preset: 'crystal', dur: 600 },
      { type: 'tint', color: 0xaaccff, alpha: 0.1, dur: 800 },
    ]},
    { text: '수정 사슴이 기품 있게 걸어 나왔다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx + 80, y: cy, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 500 },
      { type: 'move', target: 'mon', fromX: cx + 80, toX: cx, dur: 600, ease: 'easeOut' },
    ]},
    { text: '수정 뿔에서 무지개빛이 반사된다.', effects: [
      { type: 'flash', color: 0xeeddff, dur: 300 },
    ]},
  ],
  lava_crab: (img) => [
    { text: '바위가 녹아내리는 소리가 들린다...', effects: [
      { type: 'bg', preset: 'lava', dur: 600 },
      { type: 'tint', color: 0xff2200, alpha: 0.15, dur: 600 },
    ]},
    { text: '용암 집게가 뜨거운 집게를 딱딱 부딪히며 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 50, size: 130, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 400 },
      { type: 'move', target: 'mon', fromY: cy + 50, toY: cy, dur: 500 },
      { type: 'shake', dur: 300, intensity: 5 },
    ]},
    { text: '발밑의 돌이 빨갛게 달아오르고 있다.', effects: [
      { type: 'bounce', target: 'mon', height: 10, dur: 400 },
    ]},
  ],
  spore_fox: (img) => [
    { text: '알록달록한 포자가 공중에 흩날린다...', effects: [
      { type: 'bg', preset: 'spirit', dur: 600 },
      { type: 'tint', color: 0xaa44cc, alpha: 0.15, dur: 800 },
    ]},
    { text: '포자 여우가 꼬리를 흔들며 장난스럽게 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx - 60, y: cy, size: 130, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 400 },
      { type: 'move', target: 'mon', fromX: cx - 60, toX: cx, dur: 500, ease: 'bounce' },
    ]},
    { text: '환각 포자에 정신이 살짝 흐려진다.', effects: [
      { type: 'shake', dur: 400, intensity: 4 },
      { type: 'tint', color: 0xcc66ff, alpha: 0.2, dur: 500 },
    ]},
  ],
  iron_boar: (img) => [
    { text: '쿵... 쿵... 무거운 발소리가 다가온다.', effects: [
      { type: 'bg', preset: 'mountain', dur: 600 },
      { type: 'shake', dur: 500, intensity: 4 },
    ]},
    { text: '강철 멧돼지가 갈기를 세우며 길을 막았다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx + 100, y: cy, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 300 },
      { type: 'move', target: 'mon', fromX: cx + 100, toX: cx, dur: 400, ease: 'easeOut' },
      { type: 'shake', dur: 300, intensity: 8 },
    ]},
    { text: '강철처럼 단단한 몸이 햇빛을 반사한다.', effects: [
      { type: 'flash', color: 0xcccccc, dur: 200 },
    ]},
  ],
  stone_tortoise: (img) => [
    { text: '돌더미인 줄 알았던 것이 움직인다...', effects: [
      { type: 'bg', preset: 'desert', dur: 600 },] },
    { text: '바위 거북이 천천히 고개를 들었다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 20, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 800 },
      { type: 'move', target: 'mon', fromY: cy + 20, toY: cy, dur: 1000, ease: 'easeOut' },
    ]},
    { text: '등에 자란 이끼에서 오랜 세월이 느껴진다.', effects: [
      { type: 'tint', color: 0x446633, alpha: 0.1, dur: 600 },
    ]},
  ],
  rumble_bear: (img) => [
    { text: '땅이 크게 진동한다... 쿵, 쿵!', effects: [
      { type: 'bg', preset: 'mountain', dur: 600 },
      { type: 'shake', dur: 600, intensity: 8 },
    ]},
    { text: '진동 곰이 거대한 몸을 일으켜 세웠다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 60, size: 150, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 400 },
      { type: 'move', target: 'mon', fromY: cy + 60, toY: cy, dur: 500, ease: 'easeOut' },
      { type: 'zoom', target: 'mon', from: 0.7, to: 1, dur: 500 },
    ]},
    { text: '발걸음 하나에 주변이 흔들린다.', effects: [
      { type: 'shake', dur: 400, intensity: 6 },
      { type: 'bounce', target: 'mon', height: 8, dur: 400 },
    ]},
  ],
  thorn_hedgehog: (img) => [
    { text: '발밑에서 뭔가 바스락거린다...', effects: [
      { type: 'bg', preset: 'forest', dur: 600 },
      { type: 'tint', color: 0x443300, alpha: 0.1, dur: 600 },
    ]},
    { text: '가시 고슴도치가 독가시를 곤두세우며 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 40, size: 120, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 400 },
      { type: 'move', target: 'mon', fromY: cy + 40, toY: cy, dur: 400 },
      { type: 'zoom', target: 'mon', from: 0.8, to: 1.1, dur: 300 },
    ]},
    { text: '강렬한 냄새로 영역을 표시하고 있다.', effects: [
      { type: 'zoom', target: 'mon', from: 1.1, to: 1, dur: 300 },
    ]},
  ],
  storm_hawk: (img) => [
    { text: '갑자기 돌풍이 몰아친다!', effects: [
      { type: 'bg', preset: 'storm', dur: 600 },
      { type: 'shake', dur: 400, intensity: 7 },
      { type: 'pan', x: -20, dur: 300 },
    ]},
    { text: '폭풍 매가 하늘에서 급강하했다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy - 100, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 200 },
      { type: 'move', target: 'mon', fromY: cy - 100, toY: cy, dur: 300, ease: 'easeIn' },
      { type: 'flash', color: 0xffffff, dur: 150 },
      { type: 'shake', dur: 200, intensity: 6 },
    ]},
    { text: '날개짓 한 번에 바람이 소용돌이친다.', effects: [
      { type: 'bounce', target: 'mon', height: 25, dur: 500 },
      { type: 'pan', x: 20, dur: 400 },
    ]},
  ],
  shadow_cat: (img) => [
    { text: '그림자가 살랑살랑 일렁거린다...', effects: [
      { type: 'bg', preset: 'shadow', dur: 600 },
      { type: 'tint', color: 0x220033, alpha: 0.2, dur: 600 },
    ]},
    { text: '그림자 고양이가 호기심 가득한 눈으로 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 120, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 0.8, dur: 600 },
    ]},
    { text: '몸이 그림자처럼 흔들리며 형태를 바꾼다.', effects: [
      { type: 'fade', target: 'mon', from: 0.8, to: 1, dur: 300 },
      { type: 'bounce', target: 'mon', height: 12, dur: 500 },
    ]},
  ],
  coral_seahorse: (img) => [
    { text: '물속에서 화려한 빛이 반짝인다...', effects: [
      { type: 'bg', preset: 'ocean', dur: 600 },
      { type: 'tint', color: 0xff88aa, alpha: 0.1, dur: 800 },
    ]},
    { text: '산호 해마가 우아하게 헤엄치며 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx - 50, y: cy + 30, size: 120, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 500 },
      { type: 'move', target: 'mon', fromX: cx - 50, fromY: cy + 30, toX: cx, toY: cy, dur: 700, ease: 'easeInOut' },
    ]},
    { text: '물 온도가 미세하게 변하며 감정을 전하고 있다.', effects: [
      { type: 'bounce', target: 'mon', height: 10, dur: 600 },
    ]},
  ],
  wind_serpent: (img) => [
    { text: '쉬이이이... 위협적인 소리가 바람을 탄다.', effects: [
      { type: 'bg', preset: 'wind', dur: 600 },
      { type: 'pan', x: -30, dur: 500 },
      { type: 'tint', color: 0x226644, alpha: 0.15, dur: 600 },
    ]},
    { text: '바람 뱀이 공중에서 또아리를 틀며 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx + 60, y: cy - 20, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 400 },
      { type: 'move', target: 'mon', fromX: cx + 60, toX: cx, dur: 500, ease: 'easeOut' },
      { type: 'pan', x: 30, dur: 500 },
    ]},
    { text: '바람을 타고 날아다니는 몸이 위협적이다.', effects: [
      { type: 'shake', dur: 300, intensity: 5 },
    ]},
  ],
  swamp_leech: (img) => [
    { text: '발밑이 질척이며 독한 점액이 보인다...', effects: [
      { type: 'bg', preset: 'swamp', dur: 600 },
      { type: 'tint', color: 0x334400, alpha: 0.2, dur: 800 },
    ]},
    { text: '늪지 거머리가 거대한 몸을 드러냈다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 60, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 500 },
      { type: 'move', target: 'mon', fromY: cy + 60, toY: cy, dur: 700, ease: 'easeOut' },
    ]},
    { text: '끈적한 점액이 흘러내리며 악취를 풍긴다.', effects: [
      { type: 'shake', dur: 300, intensity: 4 },
    ]},
  ],
  thunder_eel: (img) => [
    { text: '물속에서 파직! 전기 불꽃이 튄다.', effects: [
      { type: 'bg', preset: 'ocean', dur: 600 },
      { type: 'flash', color: 0xffff00, dur: 150 },
      { type: 'shake', dur: 200, intensity: 5 },
    ]},
    { text: '번개 장어가 전류를 뿜으며 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 140, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 300 },
      { type: 'flash', color: 0xffffaa, dur: 200 },
    ]},
    { text: '주변 물이 전기로 부글부글 끓어오른다.', effects: [
      { type: 'shake', dur: 400, intensity: 6 },
      { type: 'tint', color: 0xffff44, alpha: 0.15, dur: 400 },
    ]},
  ],
  smoke_weasel: (img) => [
    { text: '연기가 피어오르더니... 사라졌다?', effects: [
      { type: 'bg', preset: 'fog', dur: 600 },
      { type: 'tint', color: 0x666666, alpha: 0.3, dur: 600 },
    ]},
    { text: '연기 족제비가 어느새 뒤에 나타났다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy, size: 120, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 200 },
      { type: 'flash', color: 0xffffff, dur: 100 },
      { type: 'tint', color: 0x666666, alpha: 0, dur: 300 },
    ]},
    { text: '연기처럼 사라졌다 나타나며 혼란을 준다.', effects: [
      { type: 'fade', target: 'mon', from: 1, to: 0.5, dur: 300 },
      { type: 'fade', target: 'mon', from: 0.5, to: 1, dur: 300 },
    ]},
  ],
  moss_golem: (img) => [
    { text: '땅이 크게 흔들리고, 바위가 일어선다...', effects: [
      { type: 'bg', preset: 'ruins', dur: 600 },
      { type: 'shake', dur: 700, intensity: 8 },
      { type: 'tint', color: 0x334422, alpha: 0.15, dur: 800 },
    ]},
    { text: '이끼 골렘이 거대한 몸을 일으켰다!', effects: [
      { type: 'sprite', img, id: 'mon', x: cx, y: cy + 80, size: 160, alpha: 0 },
      { type: 'fade', target: 'mon', from: 0, to: 1, dur: 500 },
      { type: 'move', target: 'mon', fromY: cy + 80, toY: cy, dur: 800, ease: 'easeOut' },
      { type: 'zoom', target: 'mon', from: 0.6, to: 1, dur: 700 },
    ]},
    { text: '오래된 이끼와 바위 사이에서 깊은 숨소리가 들린다.', effects: [
      { type: 'shake', dur: 300, intensity: 3 },
    ]},
  ],
};
