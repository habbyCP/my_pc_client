truncateString = function (str, maxLength) {
    if (str.length <= maxLength) {
        return str;
    }
    return str.slice(0, maxLength) + '...';
}
module.exports = {
    truncateString
}
