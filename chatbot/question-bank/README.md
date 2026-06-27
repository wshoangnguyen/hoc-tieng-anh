# Hướng dẫn soạn câu hỏi cho Buddy AI

## Cấu trúc 1 câu hỏi

```json
{
  "id": "L{level}-U{unit}-{SKILL}-{số}",
  "unit": 1,
  "skill": "vocab",
  "topic": "animals",
  "subtopic": "farm_animals",
  "type": "multiple_choice",
  "difficulty": 1,
  "question": "Câu hỏi hiển thị cho học sinh",
  "options": ["A", "B", "C"],
  "answer": 0,
  "explanation": "Giải thích tại sao đáp án này đúng"
}
```

## Quy tắc đặt ID

- **L1-U3-GRAM-005** → Level 1, Unit 3, Grammar, câu số 5
- Kỹ năng viết tắt: **VOCA** (từ vựng), **GRAM** (ngữ pháp), **READ** (đọc), **LIST** (nghe), **SPEA** (nói)

## Các trường bắt buộc

| Field | Ý nghĩa | Ví dụ |
|---|---|---|
| `id` | Mã duy nhất | `L1-U3-GRAM-001` |
| `skill` | Kỹ năng | `vocab`, `grammar`, `reading`, `listening`, `speaking` |
| `topic` | Chủ đề chính | `animals`, `past_simple`, `colors` |
| `type` | Dạng câu hỏi | `multiple_choice`, `fill_blank`, `arrange_words` |
| `difficulty` | Độ khó 1-5 | 1=dễ nhất, 5=khó nhất |
| `question` | Câu hỏi | Tiếng Việt hoặc Anh-Việt |
| `answer` | Đáp án | Với multiple_choice: index (0=A, 1=B, 2=C). Với fill_blank: chuỗi |
| `explanation` | Giải thích | Viết bằng tiếng Việt, đơn giản |

## Các dạng câu hỏi

### multiple_choice
```json
{
  "type": "multiple_choice",
  "options": ["go", "went", "goed"],
  "answer": 1
}
```

### fill_blank (điền từ)
```json
{
  "type": "fill_blank",
  "answer": "didn't go"
}
```

### arrange_words (sắp xếp từ)
```json
{
  "type": "arrange_words",
  "answer": "I like dogs"
}
```

## Danh sách topic có sẵn

| Topic | Skill | Mô tả |
|---|---|---|
| `alphabet` | vocab | Bảng chữ cái |
| `numbers` | vocab | Số đếm |
| `colors` | vocab | Màu sắc |
| `family` | vocab | Gia đình |
| `animals` | vocab | Động vật |
| `food` | vocab | Đồ ăn |
| `body` | vocab | Cơ thể |
| `clothes` | vocab | Quần áo |
| `places` | vocab | Địa điểm |
| `daily_routines` | vocab | Hoạt động hàng ngày |
| `present_simple` | grammar | Thì hiện tại đơn |
| `present_continuous` | grammar | Thì hiện tại tiếp diễn |
| `past_simple` | grammar | Thì quá khứ đơn |
| `be_verb` | grammar | Động từ to be |
| `wh_questions` | grammar | Câu hỏi Wh- |
| `there_is_are` | grammar | There is / There are |
| `like_dont_like` | grammar | Diễn đạt sở thích |

## Mẹo

- Mỗi unit nên có ít nhất **5-10 câu hỏi** để tránh lặp
- Độ khó 1-2: cho học sinh mới bắt đầu
- Độ khó 3: cho học sinh trung bình
- Độ khó 4-5: cho học sinh khá, cần suy luận
