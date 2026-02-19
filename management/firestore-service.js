// file: firestore-service.js

import { 
    auth, db,
    doc, setDoc, getDoc, getDocs, collection, query, where, orderBy, 
    updateDoc, deleteDoc, serverTimestamp, increment 
} from './firebase-config.js';

// ==================== USER SERVICES ====================

// Thêm user mới vào Firestore (gọi sau khi đăng ký Auth)
export async function createUserProfile(userId, userData) {
    try {
        const userRef = doc(db, "users", userId);
        const newUser = {
            username: userData.username,
            displayName: userData.displayName,
            email: userData.email,
            type: userData.type || "parent",
            phone: userData.phone || "",
            address: userData.address || "",
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            createdBy: userId,
            lastLoginAt: serverTimestamp(),
            loginCount: 1
        };
        
        await setDoc(userRef, newUser);
        console.log("✅ Tạo user profile thành công:", userId);
        return { success: true, data: newUser };
    } catch (error) {
        console.error("❌ Lỗi tạo user profile:", error);
        return { success: false, error: error.message };
    }
}

// Lấy thông tin user theo ID
export async function getUserById(userId) {
    try {
        if (!userId) {
            return { success: false, error: "Không có userId" };
        }
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            // Chuyển đổi Timestamp thành Date object để dễ xử lý
            const data = userSnap.data();
            return { success: true, data: { id: userSnap.id, ...data } };
        } else {
            console.log("User không tồn tại:", userId);
            return { success: false, error: "User không tồn tại" };
        }
    } catch (error) {
        console.error("❌ Lỗi lấy user:", error);
        return { success: false, error: error.message };
    }
}

// Lấy tất cả users
export async function getAllUsers() {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({ id: doc.id, ...data });
        });
        
        console.log(`✅ Lấy ${users.length} users thành công`);
        return { success: true, data: users };
    } catch (error) {
        console.error("❌ Lỗi lấy danh sách users:", error);
        return { success: false, error: error.message };
    }
}

// Lấy users theo type
export async function getUsersByType(type) {
    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("type", "==", type), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const users = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            users.push({ id: doc.id, ...data });
        });
        
        return { success: true, data: users };
    } catch (error) {
        console.error(`❌ Lỗi lấy users type ${type}:`, error);
        return { success: false, error: error.message };
    }
}

// Cập nhật thông tin user
export async function updateUser(userId, updateData) {
    try {
        const userRef = doc(db, "users", userId);
        
        // Kiểm tra user tồn tại
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return { success: false, error: "User không tồn tại" };
        }
        
        const allowedUpdates = {
            displayName: updateData.displayName,
            phone: updateData.phone,
            address: updateData.address,
            updatedAt: serverTimestamp()
        };
        
        // Loại bỏ các field undefined
        Object.keys(allowedUpdates).forEach(key => 
            allowedUpdates[key] === undefined && delete allowedUpdates[key]
        );
        
        if (Object.keys(allowedUpdates).length > 0) {
            await updateDoc(userRef, allowedUpdates);
        }
        
        console.log("✅ Cập nhật user thành công:", userId);
        return { success: true };
    } catch (error) {
        console.error("❌ Lỗi cập nhật user:", error);
        return { success: false, error: error.message };
    }
}

// Cập nhật role user (chỉ admin)
export async function updateUserRole(userId, newType, adminId) {
    try {
        if (!adminId) {
            return { success: false, error: "Không xác định được người thực hiện" };
        }
        
        const adminCheck = await checkIsAdmin(adminId);
        if (!adminCheck.success || !adminCheck.isAdmin) {
            return { success: false, error: "Bạn không có quyền thực hiện thao tác này" };
        }
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return { success: false, error: "User không tồn tại" };
        }
        
        await updateDoc(userRef, {
            type: newType,
            roleUpdatedAt: serverTimestamp(),
            roleUpdatedBy: adminId
        });
        
        console.log(`✅ Đã cập nhật role user ${userId} thành ${newType}`);
        return { success: true };
    } catch (error) {
        console.error("❌ Lỗi cập nhật role:", error);
        return { success: false, error: error.message };
    }
}

// Xóa mềm user
export async function softDeleteUser(userId, adminId) {
    try {
        if (!adminId) {
            return { success: false, error: "Không xác định được người thực hiện" };
        }
        
        const adminCheck = await checkIsAdmin(adminId);
        if (!adminCheck.success || !adminCheck.isAdmin) {
            return { success: false, error: "Bạn không có quyền thực hiện thao tác này" };
        }
        
        if (userId === adminId) {
            return { success: false, error: "Không thể xóa tài khoản đang đăng nhập" };
        }
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return { success: false, error: "User không tồn tại" };
        }
        
        await updateDoc(userRef, {
            isActive: false,
            deletedAt: serverTimestamp(),
            deletedBy: adminId
        });
        
        console.log(`✅ Đã xóa mềm user ${userId}`);
        return { success: true };
    } catch (error) {
        console.error("❌ Lỗi soft delete user:", error);
        return { success: false, error: error.message };
    }
}

// Khôi phục user
export async function restoreUser(userId, adminId) {
    try {
        if (!adminId) {
            return { success: false, error: "Không xác định được người thực hiện" };
        }
        
        const adminCheck = await checkIsAdmin(adminId);
        if (!adminCheck.success || !adminCheck.isAdmin) {
            return { success: false, error: "Bạn không có quyền thực hiện thao tác này" };
        }
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return { success: false, error: "User không tồn tại" };
        }
        
        await updateDoc(userRef, {
            isActive: true,
            restoredAt: serverTimestamp(),
            restoredBy: adminId,
            deletedAt: null
        });
        
        console.log(`✅ Đã khôi phục user ${userId}`);
        return { success: true };
    } catch (error) {
        console.error("❌ Lỗi restore user:", error);
        return { success: false, error: error.message };
    }
}

// Kiểm tra user có phải admin không
async function checkIsAdmin(userId) {
    try {
        if (!userId) {
            return { success: false, isAdmin: false, error: "Không có userId" };
        }
        
        const result = await getUserById(userId);
        if (result.success) {
            return { success: true, isAdmin: result.data.type === 'admin' };
        }
        return { success: false, isAdmin: false };
    } catch (error) {
        return { success: false, isAdmin: false, error: error.message };
    }
}

// Cập nhật thời gian đăng nhập cuối
export async function updateLastLogin(userId) {
    try {
        if (!userId) {
            return { success: false, error: "Không có userId" };
        }
        
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
            return { success: false, error: "User không tồn tại" };
        }
        
        await updateDoc(userRef, {
            lastLoginAt: serverTimestamp(),
            loginCount: increment(1)
        });
        return { success: true };
    } catch (error) {
        console.error("❌ Lỗi cập nhật last login:", error);
        return { success: false, error: error.message };
    }
}

// ==================== STUDENT SERVICES ====================

// file: firestore-service.js - Sửa hàm createStudent

// Thêm học sinh mới
export async function createStudent(studentData, createdBy) {
    try {
        if (!createdBy) {
            return { success: false, error: "Không xác định được người tạo" };
        }
        
        // Tạo reference đến collection students
        const studentsRef = collection(db, "students");
        
        // Tạo document mới với ID tự động
        const newStudentRef = doc(studentsRef); // Tạo reference trước
        
        const newStudent = {
            fullName: studentData.fullName,
            nickname: studentData.nickname || "",
            dob: studentData.dob || null,
            phone: studentData.phone || "",
            classGroup: studentData.classGroup || "",
            status: studentData.status || "active",
            // Sửa: Tạo reference đúng cách
            createdBy: doc(db, "users", createdBy),  // Đây là cách đúng để tạo reference
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        // Sử dụng setDoc với reference đã tạo
        await setDoc(newStudentRef, newStudent);
        console.log("✅ Thêm học sinh thành công:", newStudentRef.id);
        
        return { success: true, id: newStudentRef.id };
    } catch (error) {
        console.error("❌ Lỗi thêm học sinh:", error);
        return { success: false, error: error.message };
    }
}

// Lấy danh sách học sinh
export async function getAllStudents() {
    try {
        const studentsRef = collection(db, "students");
        const q = query(studentsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        const students = [];
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            
            // Xử lý reference createdBy
            let createdByName = null;
            if (data.createdBy) {
                try {
                    // Lấy ID từ reference path
                    const creatorId = data.createdBy.id || data.createdBy.path?.split('/').pop();
                    if (creatorId) {
                        const creatorResult = await getUserById(creatorId);
                        if (creatorResult.success) {
                            createdByName = creatorResult.data.displayName;
                        }
                    }
                } catch (e) {
                    console.log("Không lấy được thông tin người tạo:", e);
                }
            }
            
            students.push({
                id: doc.id,
                fullName: data.fullName || '',
                nickname: data.nickname || '',
                dob: data.dob || '',
                phone: data.phone || '',
                classGroup: data.classGroup || '',
                status: data.status || 'active',
                createdByName: createdByName
            });
        }
        
        return { success: true, data: students };
    } catch (error) {
        console.error("❌ Lỗi lấy danh sách học sinh:", error);
        return { success: false, error: error.message };
    }
}

// Xóa học sinh
export async function deleteStudent(studentId) {
    try {
        if (!studentId) {
            return { success: false, error: "Không có studentId" };
        }
        
        const studentRef = doc(db, "students", studentId);
        await deleteDoc(studentRef);
        
        console.log("✅ Xóa học sinh thành công:", studentId);
        return { success: true };
    } catch (error) {
        console.error("❌ Lỗi xóa học sinh:", error);
        return { success: false, error: error.message };
    }
}

// Cập nhật thông tin học sinh
export async function updateStudent(studentId, updateData) {
    try {
        if (!studentId) {
            return { success: false, error: "Không có studentId" };
        }
        
        const studentRef = doc(db, "students", studentId);
        
        const allowedUpdates = {
            fullName: updateData.fullName,
            nickname: updateData.nickname,
            phone: updateData.phone,
            classGroup: updateData.classGroup,
            status: updateData.status,
            updatedAt: serverTimestamp()
        };
        
        // Loại bỏ các field undefined
        Object.keys(allowedUpdates).forEach(key => 
            allowedUpdates[key] === undefined && delete allowedUpdates[key]
        );
        
        if (Object.keys(allowedUpdates).length > 0) {
            await updateDoc(studentRef, allowedUpdates);
        }
        
        console.log("✅ Cập nhật học sinh thành công:", studentId);
        return { success: true };
    } catch (error) {
        console.error("❌ Lỗi cập nhật học sinh:", error);
        return { success: false, error: error.message };
    }
}
