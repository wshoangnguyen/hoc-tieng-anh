import sentences from "@/assets/json/sentences.json";

export const useSentences = () => {
    const getByBook = (book) => {
        return sentences.filter(item => item.book === book)
    }

    const getByUnit = (book, unit) => {
        return sentences.find(
            item => item.book === book && item.unit === unit
        )
    }

    return {
        sentences,
        getByBook,
        getByUnit
    }
}