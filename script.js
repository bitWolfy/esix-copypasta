Promise.all([
    fetchRecords(),
    fetchRules(),
    fetchPrebuilt(),
]).then((data) => {

    const url = new URL(document.location);

    const reasons = data[0],
        rules = data[1],
        prebuilt = data[2];
    console.log("reasons", reasons);
    console.log("rules", rules);
    console.log("prebuilt", prebuilt);

    // Generate the prebuilt links section
    const prebuiltWrapper = $("#prebuilt-links")
    for (const link of prebuilt) {
        $("<a>")
            .attr({
                "href": link.url,
            })
            .addClass("m-2")
            .text(link.title)
            .appendTo(prebuiltWrapper);
    }

    const output = $("#output");

    // Create the reasons dropdown
    const reasonDropdown = $("#input-reason").on("change", () => {
        output.trigger("util:regenerate");
        const value = reasonDropdown.val();
        $("#input-reason-custom-wrapper").toggleClass("d-none", value !== "custom");
    });
    for (const [name, text] of Object.entries(reasons)) {
        $("<option>")
            .attr({
                "value": name,
            })
            .html(text)
            .appendTo(reasonDropdown);
    }
    if (url.searchParams.has("reason")) {
        const importedReason = url.searchParams.get("reason");
        reasonDropdown.val(importedReason);
        if (importedReason == "custom")
            $("#input-reason-custom-wrapper").removeClass("d-none")
    }


    // Custom reason
    let timerReason = null;
    const reasonCustom = $("#input-reason-custom").on("input", () => {
        clearTimeout(timerReason);
        timerReason = setTimeout(() => { output.trigger("util:regenerate"); }, 200);
    });
    if (url.searchParams.has("custom"))
        reasonCustom.val(url.searchParams.get("custom"));

    // Keep track of sources
    let timeSources = null;
    const sources = $("#sources").on("input", () => {
        clearTimeout(timeSources);
        timeSources = setTimeout(() => { output.trigger("util:regenerate"); }, 200);
    });
    if (url.searchParams.has("sources"))
        sources.val(url.searchParams.get("sources"));

    // Add prebuilt rules
    const enabledRules = url.searchParams.has("rules") ? url.searchParams.get("rules").split(",") : [];
    const rulesButtons = $("#rules-buttons");
    for (const [name, rule] of Object.entries(rules)) {
        const button = $("<button>")
            .addClass("btn me-2 mb-2")
            .addClass(enabledRules.includes(name) ? "btn-dark" : "btn-outline-dark")
            .attr({
                "type": "button",
                "name": name,
            })
            .data("rule", rule)
            .html(rule.title)
            .on("click", () => {
                button.toggleClass("btn-dark btn-outline-dark");
                output.trigger("util:regenerate");
            })
            .appendTo(rulesButtons);
    }

    // Reset button
    $("#button-reset").on("click", () => location.href = ".");

    // Regenerate the text whenever something changes
    output.on("util:regenerate", () => {

        // Fetch the reason
        const reasonValue = reasonDropdown.val();
        let reason = reasonValue == "custom" ? (reasonCustom.val() + "") : reasons[reasonValue];
        if (!reason) reason = "!REASON EMPTY!";

        // Add sources
        const sourceList = (sources.val() + "").split("\n").filter(n => n);
        let sourceOutput = [];
        if (sourceList.length == 0) sourceOutput = [];
        else if (sourceList.length == 1) sourceOutput = [`"[Source]":${sourceList[0]}`];
        else
            for (const [index, source] of sourceList.entries()) sourceOutput.push(`"[${index + 1}]":${source}`);

        // Append rules excerpts
        const rulesOutput = [];
        const activeRules = [];
        for (const button of rulesButtons.find("button.btn-dark").get()) {
            const ruleData = $(button).data("rule");
            const name = $(button).attr("name");
            activeRules.push(name);

            const ruleLines = [];
            for (const ruleLine of ruleData.rules)
                ruleLines.push(`* ${ruleLine}`);
            rulesOutput.push(`[section=${ruleData.title}]\n` +
                `[b]This category includes:[/b]\n` +
                `${ruleLines.join("\n")}\n` +
                `"[Code of Conduct - ${ruleData.title}]":${ruleData.link}\n` +
                `[/section]`
            );
        }

        // Compose the record text
        output.val(
            reason + " " + sourceOutput.join(" ") + "\n" +
            rulesOutput.join("\n")
        );

        // Update the URL
        const params = [];
        if (reasonValue !== "null") {
            url.searchParams.set("reason", reasonValue);
            if (reasonValue == "custom" && reasonCustom.val())
                url.searchParams.set("custom", reasonCustom.val() + "");
            else url.searchParams.delete("custom");
        } else {
            url.searchParams.delete("reason");
            url.searchParams.delete("custom");
        }

        if (sourceList.length > 0)
            url.searchParams.set("sources", sourceList.join("\n"));
        else url.searchParams.delete("sources");

        if (activeRules.length > 0)
            url.searchParams.set("rules", activeRules.join(","));
        else url.searchParams.delete("rules");


        const searchPrefix = url.searchParams.toString().length === 0 ? "" : "?";
        history.replaceState({}, "", url.origin + url.pathname + searchPrefix + url.searchParams.toString() + url.hash);
    });
    output.trigger("util:regenerate");
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

async function fetchPrebuilt() {
    return new Promise((resolve) => {
        $.getJSON("prebuilt.json", (json) => resolve(json));
    });
}
