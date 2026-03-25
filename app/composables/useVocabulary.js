import vocabulary from "@/assets/json/vocabulary.json";

export const useVocabulary = () => {
    const getByBook = (book) => {
        return vocabulary.filter(item => item.book === book)
    }

    const getByUnit = (book, unit) => {
        return vocabulary.find(
            item => item.book === book && item.unit === unit
        )
    }

    return {
        vocabulary,
        getByBook,
        getByUnit
    }
}