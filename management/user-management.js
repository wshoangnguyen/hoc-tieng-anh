// file: user-management.js

import { db } from './login.html';
import { 
    collection, 
    getDocs, 
    query, 
    where, 
    orderBy, 
    limit 
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Hàm lấy tất cả users
async function getAllUsers() {
    try {
        // Tạo reference đến collection 'users'
        const usersRef = collection(db, "users");
        
        // Tạo query để sắp xếp theo thời gian tạo giảm dần
        const q = query(usersRef, orderBy("createdAt", "desc"));
        
        // Thực hiện query
        const querySnapshot = await getDocs(q);
        
        // Mảng chứa kết quả
        const users = [];
        
        // Duyệt qua từng document
        querySnapshot.forEach((doc) => {
            // doc.data() là nội dung document
            // doc.id là ID của document
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        // Hiển thị ra console
        console.log("Danh sách users:", users);
        console.log(`Tổng số: ${users.length} users`);
        
        return users;
        
    } catch (error) {
        console.error("Lỗi khi lấy danh sách users:", error);
        
        // Xử lý lỗi permission
        if (error.code === 'permission-denied') {
            console.error("Bạn không có quyền xem danh sách users!");
        }
        
        return [];
    }
}

// Hàm lấy users theo type (phân quyền)
async function getUsersByType(type) {
    try {
        const usersRef = collection(db, "users");
        
        // Query có điều kiện where
        const q = query(
            usersRef, 
            where("type", "==", type), // Lọc theo type
            orderBy("createdAt", "desc")
        );
        
        const querySnapshot = await getDocs(q);
        const users = [];
        
        querySnapshot.forEach((doc) => {
            users.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        console.log(`Danh sách users type = ${type}:`, users);
        return users;
        
    } catch (error) {
        console.error(`Lỗi khi lấy users type ${type}:`, error);
        return [];
    }
}

// Hàm tìm kiếm user theo username hoặc email
async function searchUsers(searchTerm) {
    try {
        const usersRef = collection(db, "users");
        
        // Lưu ý: Firestore không hỗ trợ search "like" trực tiếp
        // Cần tạo nhiều queries hoặc dùng external search (Algolia)
        
        // Cách đơn giản: lấy tất cả và filter trong code
        const querySnapshot = await getDocs(usersRef);
        const results = [];
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            // Tìm kiếm không phân biệt hoa thường
            if (data.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                data.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                data.email.toLowerCase().includes(searchTerm.toLowerCase())) {
                results.push({
                    id: doc.id,
                    ...data
                });
            }
        });
        
        console.log(`Kết quả tìm kiếm "${searchTerm}":`, results);
        return results;
        
    } catch (error) {
        console.error("Lỗi tìm kiếm:", error);
        return [];
    }
}

export { getAllUsers, getUsersByType, searchUsers };

// file: user-management.js (thêm các hàm sau)

import { 
    updateDoc,
    doc,
    increment // Tăng/giảm giá trị number
} from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Hàm cập nhật thông tin cơ bản của user
async function updateUser(userId, updateData) {
    try {
        // Tạo reference đến user cần cập nhật
        const userRef = doc(db, "users", userId);
        
        // Kiểm tra user có tồn tại không
        const userDoc = await getDoc(userRef);
        
        if (!userDoc.exists()) {
            throw new Error("User không tồn tại!");
        }
        
        // Cập nhật thông tin
        // Lưu ý: chỉ cập nhật những field được phép
        const allowedFields = {
            displayName: updateData.displayName,
            phone: updateData.phone,
            address: updateData.address,
            updatedAt: serverTimestamp(),
            updatedBy: auth.currentUser?.uid // Người cập nhật
        };
        
        // Loại bỏ các field undefined
        Object.keys(allowedFields).forEach(key => 
            allowedFields[key] === undefined && delete allowedFields[key]
        );
        
        await updateDoc(userRef, allowedFields);
        
        console.log(`Cập nhật user ${userId} thành công!`);
        return true;
        
    } catch (error) {
        console.error("Lỗi cập nhật user:", error);
        
        if (error.code === 'not-found') {
            console.error("Không tìm thấy user!");
        } else if (error.code === 'permission-denied') {
            console.error("Bạn không có quyền cập nhật user này!");
        }
        
        return false;
    }
}

// Hàm cập nhật role (type) - chỉ admin mới được dùng
async function updateUserRole(userId, newType) {
    try {
        // Kiểm tra quyền admin
        const currentUser = auth.currentUser;
        if (!currentUser) {
            throw new Error("Bạn chưa đăng nhập!");
        }
        
        // Lấy thông tin user hiện tại
        const currentUserDoc = await getDoc(doc(db, "users", currentUser.uid));
        const currentUserData = currentUserDoc.data();
        
        // Chỉ admin mới được thay đổi role
        if (currentUserData.type !== 'admin') {
            throw new Error("Bạn không có quyền thay đổi role!");
        }
        
        // Cập nhật role
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            type: newType,
            roleUpdatedAt: serverTimestamp(),
            roleUpdatedBy: currentUser.uid
        });
        
        console.log(`Đã cập nhật role user ${userId} thành ${newType}`);
        return true;
        
    } catch (error) {
        console.error("Lỗi cập nhật role:", error);
        return false;
    }
}

// Hàm cập nhật số lần đăng nhập
async function updateLastLogin(userId) {
    try {
        const userRef = doc(db, "users", userId);
        
        // increment: tăng giá trị lên 1
        await updateDoc(userRef, {
            lastLoginAt: serverTimestamp(),
            loginCount: increment(1) // Tăng số lần đăng nhập
        });
        
        console.log(`Đã cập nhật thời gian đăng nhập cho user ${userId}`);
        return true;
        
    } catch (error) {
        console.error("Lỗi cập nhật last login:", error);
        return false;
    }
}

export { updateUser, updateUserRole, updateLastLogin };

// file: user-management.js (thêm các hàm sau)

import { deleteDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";
import { deleteUser } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";

// Hàm kiểm tra quyền admin
async function isAdmin() {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;
    
    const userDoc = await getDoc(doc(db, "users", currentUser.uid));
    const userData = userDoc.data();
    
    return userData?.type === 'admin';
}

// Hàm xóa user (cả Auth và Firestore)
async function deleteUserById(userId) {
    try {
        // Bước 1: Kiểm tra quyền admin
        if (!await isAdmin()) {
            throw new Error("Chỉ admin mới có quyền xóa user!");
        }
        
        // Bước 2: Không cho phép xóa chính mình
        if (userId === auth.currentUser?.uid) {
            throw new Error("Không thể xóa tài khoản đang đăng nhập!");
        }
        
        // Bước 3: Xóa document trong Firestore
        const userRef = doc(db, "users", userId);
        await deleteDoc(userRef);
        console.log(`Đã xóa user ${userId} khỏi Firestore`);
        
        // Bước 4: Xóa user trong Authentication
        // Lưu ý: Cần có quyền admin trên Firebase Console để xóa Auth user
        // Hoặc dùng Firebase Admin SDK (server-side)
        try {
            // Cách này chỉ hoạt động nếu user hiện tại có quyền admin trong Auth
            // Thực tế nên dùng Cloud Function để xóa Auth user
            const userToDelete = await auth.getUser(userId);
            await deleteUser(userToDelete);
            console.log(`Đã xóa user ${userId} khỏi Authentication`);
        } catch (authError) {
            console.warn("Không thể xóa Auth user (cần dùng Admin SDK):", authError);
        }
        
        return true;
        
    } catch (error) {
        console.error("Lỗi xóa user:", error);
        
        if (error.code === 'permission-denied') {
            alert("Bạn không có quyền xóa user này!");
        } else {
            alert(error.message);
        }
        
        return false;
    }
}

// Hàm xóa mềm (soft delete) - chỉ đánh dấu là đã xóa
async function softDeleteUser(userId) {
    try {
        if (!await isAdmin()) {
            throw new Error("Chỉ admin mới có quyền này!");
        }
        
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            isActive: false,
            deletedAt: serverTimestamp(),
            deletedBy: auth.currentUser?.uid
        });
        
        console.log(`Đã đánh dấu xóa user ${userId}`);
        return true;
        
    } catch (error) {
        console.error("Lỗi soft delete:", error);
        return false;
    }
}

// Hàm khôi phục user đã xóa mềm
async function restoreUser(userId) {
    try {
        if (!await isAdmin()) {
            throw new Error("Chỉ admin mới có quyền này!");
        }
        
        const userRef = doc(db, "users", userId);
        await updateDoc(userRef, {
            isActive: true,
            restoredAt: serverTimestamp(),
            restoredBy: auth.currentUser?.uid,
            deletedAt: null // Xóa trường deletedAt
        });
        
        console.log(`Đã khôi phục user ${userId}`);
        return true;
        
    } catch (error) {
        console.error("Lỗi khôi phục user:", error);
        return false;
    }
}

export { deleteUserById, softDeleteUser, restoreUser };