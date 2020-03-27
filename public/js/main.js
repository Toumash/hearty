var $sel = $("#generator-select");

var generators = [
  { name: "noise", fn: () => runP5demo() },
  { name: "lines", fn: () => runD3Demo() },
  { name: "pattern", fn: () => runP5demo2() },
  { name: "abstraction", fn: () => runP5demo3() }
];

generators.forEach((e, i) => {
  $sel.append(
    $("<option>")
      .attr("value", i)
      .text(e.name)[0]
  );
});

$("#generator-select").on("change", function(e) {
  let idx = e.target.value;
  let generator = generators[idx];
  console.log("generator.selected", generator.name);
  generator.fn();
});
