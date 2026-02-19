// file: debug-guide.js

// 1. Lỗi "permission-denied"
// Nguyên nhân: Rules trên Firebase chưa cho phép thao tác
// Cách fix: Vào Firebase Console > Firestore Database > Rules

// Rules mẫu cho phép đọc/ghi khi đã đăng nhập:
/*
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Cho phép đọc/ghi nếu user đã đăng nhập
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Hoặc chi tiết hơn:
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   (request.auth.uid == userId || 
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.type == 'admin');
    }
  }
}
*/

// 2. Lỗi "document not found"
async function safeGetDocument(collectionName, docId) {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());
            return docSnap.data();
        } else {
            console.log("Không tìm thấy document!");
            return null;
        }
    } catch (error) {
        console.error("Lỗi khi lấy document:", error);
        return null;
    }
}

// 3. Debug với try-catch chi tiết
async function debugFirestoreOperation(operation, ...params) {
    try {
        console.group(`🔍 Debug: ${operation}`);
        console.log("Tham số đầu vào:", params);
        
        const result = await operation(...params);
        
        console.log("✅ Kết quả:", result);
        console.groupEnd();
        
        return result;
    } catch (error) {
        console.error("❌ Lỗi:", error);
        console.log("Mã lỗi:", error.code);
        console.log("Thông báo:", error.message);
        console.log("Stack trace:", error.stack);
        console.groupEnd();
        
        // Gửi lỗi lên server để tracking (nếu cần)
        // await logErrorToServer(error);
    }
}

// 4. Kiểm tra kết nối Firestore
async function checkFirestoreConnection() {
    try {
        // Thử đọc một document nhỏ
        const testRef = doc(db, "test", "connection");
        await getDoc(testRef);
        console.log("✅ Kết nối Firestore thành công!");
        return true;
    } catch (error) {
        console.error("❌ Mất kết nối Firestore:", error);
        return false;
    }
}

// 5. Logging chi tiết cho development
const DEBUG_MODE = true; // Tắt khi production

function logFirestore(action, data, error = null) {
    if (!DEBUG_MODE) return;
    
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        action,
        data,
        error: error ? {
            code: error.code,
            message: error.message,
            stack: error.stack
        } : null
    };
    
    console.log("📝 Firestore Log:", logEntry);
    
    // Lưu log vào localStorage để debug sau
    const logs = JSON.parse(localStorage.getItem('firestore_logs') || '[]');
    logs.push(logEntry);
    localStorage.setItem('firestore_logs', JSON.stringify(logs.slice(-50))); // Giữ 50 logs gần nhất
}