let dateFormat = (date) => {
    if(!date) return "N/A"
    return new Date(date).toLocaleDateString("en-KE", {
                year: "numeric",
                month: "long",
                day: "numeric",
            })
}
export {dateFormat}