world = new WorldForm(document.getElementById("world"))
const form = new Form()
const t = new TextForm("Forma!", "black", 40, "Verdana")
form.bounds.setPosition(new Point(150, 150))
t.bounds.setPosition(new Point(200, 125))
world.append(form)
world.append(t)

function loop() {
    world.step()
    requestAnimationFrame(loop)
}
loop()

form.leftClickEvents.push(()=>{console.log("click!")})
t.leftClickEvents.push(()=>{console.log("text clicked!")})
// form.dragEvents.push(()=>{console.log("drag!")}) // Disabled for performance in the demo