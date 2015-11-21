var setSelectOption = function (element) {
    element.siblings(".select-overlay").find(".option").text(element.find("option:first").text());
};
$("body").delegate("select", "change", function () {
    $(this).siblings(".select-overlay").find(".option").text($(this).find("option:selected").text());
});