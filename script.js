Promise.all([fetchRecords(), fetchRules()]).then((data) => {
    const reasons = data[0],
        rules = data[1];
    console.log("reasons", reasons);
    console.log("rules", rules);

    const output = $("#output");

    // Create the reasons dropdown
    const reasonDropdown = $("#input-reason").on("change", () => { output.trigger("util:regenerate"); });
    for (const [name, text] of Object.entries(reasons)) {
        $("<option>")
            .attr({
                "value": name,
            })
            .html(text)
            .appendTo(reasonDropdown);
    }

    // Keep track of sources
    let timer = null;
    const sources = $("#sources").on("input", () => {
        clearTimeout(timer);
        timer = setTimeout(() => { output.trigger("util:regenerate"); }, 200);
    });

    // Add prebuilt rules
    const rulesButtons = $("#rules-buttons");
    for (const [name, rule] of Object.entries(rules)) {
        const button = $("<button>")
            .addClass("btn btn-outline-secondary me-2")
            .attr("type", "button")
            .data("rule", rule)
            .html(rule.title)
            .css("box-shadow", "none")
            .on("click", () => {
                button.toggleClass("btn-secondary btn-outline-secondary");
                output.trigger("util:regenerate");
            })
            .appendTo(rulesButtons);
    }

    // Reset button
    $("#button-reset").on("click", () => location.reload());

    // Regenerate the text whenever something changes
    output.on("util:regenerate", () => {

        // Fetch the reason
        const value = reasonDropdown.val();
        let reason = reasons[value];
        console.log(value, reason);
        if (!reason) reason = "!UNKNOWN REASON!";

        // Add sources
        const sourceList = (sources.val() + "").split("\n").filter(n => n);
        let sourceOutput = [];
        if (sourceList.length == 0) sourceOutput = [];
        else if (sourceList.length == 1) sourceOutput = [`"[Source]":${sourceList[0]}`];
        else
            for (const [index, source] of sourceList.entries()) sourceOutput.push(`"[${index + 1}]":${source}`);

        // Import rules
        const rulesOutput = [];
        for (const button of rulesButtons.find("button.btn-secondary").get()) {
            const ruleData = $(button).data("rule");
            const ruleLines = [];
            for (const ruleLine of ruleData.rules)
                ruleLines.push(`* ${ruleLine}`);
            rulesOutput.push(`[section=${ruleData.title}]\n` +
                `[b]This category includes:[/b]\n` +
                `${ruleLines.join("\n")}` +
                `"[Code of Conduct - Tagging Abuse / Tagging Vandalism]":${ruleData.link}\n` +
                `[/section]`
            );
        }

        output.val(
            reason + " " + sourceOutput.join(" ") + "\n" +
            rulesOutput.join("\n")
        );
    });
})


async function fetchRecords() {
    return new Promise((resolve) => {
        $.getJSON("reasons.json", (json) => resolve(json));
    });
}

async function fetchRules() {
    return new Promise((resolve) => {
        $.getJSON("rules.json", (json) => resolve(json));
    });
}
