import stories from "@/assets/json/stories.json";

export const useStories = () => {
    // Truy cập vào object chứa các danh mục
    const collection = stories.stories_collection;

    /**
     * Lấy danh sách danh mục
     * Trả về: [{ code: "kid_stories", label: "Kid Stories" }, ...]
     */
    const getCategories = () => {
        return Object.keys(collection).map(code => ({
            code: code,
            label: code
                .split('_')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ')
        }));
    };

    /**
     * Lấy tất cả câu chuyện của một danh mục
     * @param {string} categoryCode - ví dụ: 'kid_stories'
     */
    const getStoriesByCategory = (categoryCode) => {
        return collection[categoryCode] || [];
    };

    /**
     * Lấy một câu chuyện cụ thể theo danh mục và ID
     * @param {string} categoryCode 
     * @param {number} id 
     */
    const getStoryById = (categoryCode, id) => {
        const stories = getStoriesByCategory(categoryCode);
        return stories.find(story => story.id === id);
    };

    return {
        stories, // Toàn bộ data gốc
        getCategories,
        getStoriesByCategory,
        getStoryById
    };
};