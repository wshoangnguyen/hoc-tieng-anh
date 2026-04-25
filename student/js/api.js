// ============================================
// XỬ LÝ API VỚI GOOGLE SHEETS
// ============================================

// Lấy danh sách học sinh từ Google Sheets
async function fetchStudentsByClass(className) {
    try {
        const url = `${WEB_APP_URL}?class=${encodeURIComponent(className)}`;
        const response = await fetch(url);
        
        if (!response.ok) throw new Error("Network error");
        
        const data = await response.json();
        if (!Array.isArray(data)) return [];
        
        // Thêm mảng stickers cho mỗi học sinh
        return data.map(student => ({
            ...student,
            stickers: student.stickers || [] // Khôi phục sticker nếu có
        }));
    } catch (error) {
        console.error("Lỗi fetchStudentsByClass:", error);
        throw error;
    }
}

// Lấy danh sách tất cả học sinh
async function fetchAllStudents() {
    return fetchStudentsByClass("ALL");
}

// Lưu thay đổi của một học sinh lên server
async function saveStudentChanges(studentData) {
    try {
        const response = await fetch(WEB_APP_URL, {
            method: "POST",
            mode: "no-cors",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(studentData)
        });
        return { success: true };
    } catch (error) {
        console.error("Lỗi saveStudentChanges:", error);
        throw error;
    }
}

// Lưu nhiều học sinh cùng lúc
async function saveMultipleStudents(students) {
    const results = [];
    for (const student of students) {
        try {
            await saveStudentChanges(student);
            results.push({ id: student.id, success: true });
        } catch (error) {
            results.push({ id: student.id, success: false, error });
        }
    }
    return results;
}