/* Kho câu đố Tư duy — ngữ pháp theo level, hài nhưng đúng.
   Mỗi câu: { hoi, chon:[...], dapAn, viSao } */
window.TU_DUY_NGUPHAP = {
  SM1: [
    { hoi: "Buddy ___ một hạt giống vàng. (Buddy rất tự hào về điều đó.)", chon: ["is", "are", "am"], dapAn: "is", viSao: "Buddy là một người/vật số ít → dùng “is”." },
    { hoi: "Buddy nói: “I ___ a hat.” Nhưng thứ trên đầu Buddy là cái nồi cơm điện.", chon: ["have got", "has got", "is got"], dapAn: "have got", viSao: "Chủ ngữ “I” đi với “have got”." },
    { hoi: "Nhìn kìa! ___ là chiếc tất của Buddy. Nó bốc mùi từ thứ Hai.", chon: ["This", "These", "Those"], dapAn: "This", viSao: "Một chiếc tất (số ít, ở gần) → “This”." },
    { hoi: "Buddy ___ bay, vì Buddy là hạt giống chứ không phải con chim.", chon: ["can’t", "can", "don’t"], dapAn: "can’t", viSao: "Không có khả năng → “can’t” + động từ nguyên mẫu." },
    { hoi: "Buddy ___ con giun mỗi sáng. Hôm nay con giun trốn mất.", chon: ["visits", "visit", "visiting"], dapAn: "visits", viSao: "Hiện tại đơn, chủ ngữ số ít → thêm -s." },
    { hoi: "___ you like socks? Buddy thích, nhất là khi trời lạnh.", chon: ["Do", "Does", "Is"], dapAn: "Do", viSao: "Câu hỏi hiện tại đơn với “you” → “Do”." },
  ],
  SM2: [
    { hoi: "Look! Buddy ___ a hat. Nhưng hôm nay Buddy đội nồi cơm điện.", chon: ["is wearing", "wear", "wears"], dapAn: "is wearing", viSao: "Hành động đang diễn ra → hiện tại tiếp diễn." },
    { hoi: "There ___ two socks under the bed. Chúng trốn ở đó ba tuần rồi.", chon: ["are", "is", "be"], dapAn: "are", viSao: "Danh từ số nhiều “two socks” → “are”." },
    { hoi: "Buddy đang trốn ___ cái bàn, vì Buddy không muốn học bài.", chon: ["under", "on", "in"], dapAn: "under", viSao: "Trốn ở phía dưới → “under”." },
    { hoi: "The cat ___ sleeping on Buddy’s head. Mèo ngủ rất ngon.", chon: ["is", "are", "am"], dapAn: "is", viSao: "“The cat” số ít → “is”." },
    { hoi: "Buddy ___ swim, but he doesn’t like water.", chon: ["can", "cans", "canning"], dapAn: "can", viSao: "Sau “can” là động từ nguyên mẫu." },
    { hoi: "___ is a worm in my shoe! Nó đang ăn tất của mình.", chon: ["There", "It", "This"], dapAn: "There", viSao: "Cấu trúc “There is + danh từ” để nói có cái gì đó." },
  ],
  SM3: [
    { hoi: "Buddy usually ___ to school by dog, but today he is walking.", chon: ["goes", "is going", "go"], dapAn: "goes", viSao: "Thói quen → hiện tại đơn; “usually” là dấu hiệu." },
    { hoi: "A worm is ___ than a seed. Nhưng cả hai đều không biết bơi.", chon: ["longer", "long", "longest"], dapAn: "longer", viSao: "So sánh hơn với tính từ ngắn → thêm -er." },
    { hoi: "You ___ wear a helmet when you ride a dog. An toàn là trên hết.", chon: ["must", "mustn’t", "can’t"], dapAn: "must", viSao: "Bắt buộc → “must”." },
    { hoi: "Look! The teacher ___ at Buddy. Buddy quên bài rồi.", chon: ["is looking", "looks", "look"], dapAn: "is looking", viSao: "“Look!” báo hiệu hành động đang diễn ra." },
    { hoi: "Buddy ___ like carrots. Cậu ấy thích bánh quy hơn.", chon: ["doesn’t", "don’t", "isn’t"], dapAn: "doesn’t", viSao: "Chủ ngữ số ít → “doesn’t” + động từ nguyên mẫu." },
    { hoi: "This jacket is ___ than that one. Nhưng cả hai đều xấu như nhau.", chon: ["cheaper", "cheap", "cheapest"], dapAn: "cheaper", viSao: "So sánh hơn → “cheaper”." },
  ],
  SM4: [
    { hoi: "Yesterday Buddy ___ to the park with a worm. Họ đi bộ 3 tiếng.", chon: ["went", "go", "goes"], dapAn: "went", viSao: "“Yesterday” → quá khứ đơn, “go” thành “went”." },
    { hoi: "Buddy is ___ to plant a tree tomorrow. Cây sẽ to hơn Buddy.", chon: ["going", "go", "went"], dapAn: "going", viSao: "Kế hoạch tương lai → “be going to”." },
    { hoi: "“That was the ___ day of my life,” said the worm.", chon: ["best", "better", "good"], dapAn: "best", viSao: "So sánh nhất → “the best”." },
    { hoi: "Buddy ___ his homework, then he ate it.", chon: ["did", "does", "do"], dapAn: "did", viSao: "Chuỗi việc đã xong → quá khứ đơn “did”." },
    { hoi: "We ___ not see the film last night. Chúng mình ngủ quên.", chon: ["did", "do", "were"], dapAn: "did", viSao: "Phủ định quá khứ: “did not + động từ nguyên mẫu”." },
    { hoi: "This is the ___ hat in the shop. Nó có hình con giun.", chon: ["funniest", "funnier", "funny"], dapAn: "funniest", viSao: "So sánh nhất → “the funniest”." },
  ],
  SM5: [
    { hoi: "Buddy ___ never eaten a worm. Cậu ấy sợ lắm.", chon: ["has", "have", "is"], dapAn: "has", viSao: "Hiện tại hoàn thành, chủ ngữ số ít → “has”." },
    { hoi: "If it rains, we ___ stay at home. Buddy sợ nước.", chon: ["will", "would", "are"], dapAn: "will", viSao: "Câu điều kiện loại 1: If + hiện tại đơn, mệnh đề chính dùng “will”." },
    { hoi: "I have ___ my keys. Chúng ở trong tủ lạnh, cạnh con giun.", chon: ["lost", "lose", "losing"], dapAn: "lost", viSao: "Hiện tại hoàn thành: have + V3/ed." },
    { hoi: "She ___ live in Hanoi next year. Cô ấy đã mua vé rồi.", chon: ["will", "is", "has"], dapAn: "will", viSao: "Dự đoán/quyết định cho tương lai → “will”." },
    { hoi: "Have you ___ a giraffe? Chưa, mình chỉ thấy con giun.", chon: ["seen", "see", "saw"], dapAn: "seen", viSao: "Have + V3: see → seen." },
    { hoi: "If you don’t water a seed, it ___. Buddy đã thử rồi.", chon: ["will die", "dies", "died"], dapAn: "will die", viSao: "Điều kiện loại 1 → mệnh đề chính dùng “will”." },
  ],
  SM6: [
    { hoi: "The cake ___ eaten by Buddy. Không còn miếng nào.", chon: ["was", "is", "were"], dapAn: "was", viSao: "Bị động quá khứ, chủ ngữ số ít → “was + V3”." },
    { hoi: "The girl ___ is reading is my sister. Cô ấy đang đọc truyện về con giun.", chon: ["who", "which", "whose"], dapAn: "who", viSao: "Thay cho người → “who”." },
    { hoi: "Buddy said he ___ tired. Nhưng Buddy là hạt giống, làm gì có chân.", chon: ["was", "is", "were"], dapAn: "was", viSao: "Câu gián tiếp lùi thì: is → was." },
    { hoi: "If I ___ a tree, I would touch the clouds.", chon: ["were", "am", "is"], dapAn: "were", viSao: "Điều kiện loại 2: If + were (giả định không có thật)." },
    { hoi: "This book ___ written in 1990. Bìa có hình một hạt giống.", chon: ["was", "is", "has"], dapAn: "was", viSao: "Bị động quá khứ đơn → “was written”." },
    { hoi: "The dog ___ tail is short bit Buddy.", chon: ["whose", "who", "which"], dapAn: "whose", viSao: "Sở hữu → “whose”." },
  ],
};

/* Mẫu câu đố từ vựng — dùng nghĩa tiếng Việt của đúng Unit */
window.TU_DUY_MAU = [
  function (en, vi) { return { hoi: "Buddy lục ba lô tìm <b>" + vi + "</b>. Từ tiếng Anh của món đó là gì?", huong: "en" }; },
  function (en, vi) { return { hoi: "Buddy viết <b>" + en + "</b> lên bảng. Cô giáo hỏi: “Nghĩa là gì?”", huong: "vi" }; },
  function (en, vi) { return { hoi: "Trong túi Buddy có <b>" + vi + "</b>. Buddy gọi nó bằng tiếng Anh thế nào?", huong: "en" }; },
  function (en, vi) { return { hoi: "Buddy đố: “Từ nào dưới đây là <b>" + vi + "</b>?”", huong: "en" }; },
  function (en, vi) { return { hoi: "Buddy nói: “Mình thích <b>" + en + "</b> nhất!” Vậy Buddy thích gì?", huong: "vi" }; },
  function (en, vi) { return { hoi: "Buddy vẽ <b>" + vi + "</b> lên cát. Bạn viết từ tiếng Anh giúp Buddy nhé.", huong: "en" }; },
];
