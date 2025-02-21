import paper from "paper";

const canvas = document.getElementById("canvas");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
paper.setup(canvas);

let isDrawing = false;
let currentPath = null;
let selectedSegment = null;
let activeKnot = null;
let lastMousePoint = null;
let intersectionDots = [];

function createDefaultKnot() {
  const center = paper.view.center;
  const radius = Math.min(window.innerWidth, window.innerHeight) / 4;

  const path = new paper.Path({
    strokeColor: "blue",
    strokeWidth: 20,
    fullySelected: true,
    closed: true,
  });

  for (let t = 0; t <= 2 * Math.PI; t += 0.3) {
    const x = center.x + radius * Math.cos(t);
    const y = center.y + radius * Math.sin(t);
    path.add(new paper.Point(x, y));
  }

  path.closed = true;
  path.smooth({ type: "continuous" });
  return path;
}

function highlightIntersections() {
  // Clear previous intersection dots
  intersectionDots.forEach((dot) => dot.remove());
  intersectionDots = [];

  let intersections = [];
  paper.project.activeLayer.children.forEach((path1) => {
    paper.project.activeLayer.children.forEach((path2) => {
      if (path1 !== path2) {
        const intersect = path1.getIntersections(path2);
        intersections = intersections.concat(intersect);
      }
    });
  });

  intersections.forEach((inter) => {
    const dot = new paper.Shape.Circle({
      center: inter.point,
      radius: 5,
      fillColor: "red",
    });
    intersectionDots.push(dot);
  });
}

activeKnot = createDefaultKnot();
paper.view.draw();

function onMouseDown(event) {
  lastMousePoint = event.point;
  const point = event.point;

  if (isDrawing) {
    currentPath = new paper.Path({
      segments: [point],
      strokeColor: "black",
      strokeWidth: 2,
      fullySelected: true,
    });
  } else {
    const hitResult = paper.project.hitTest(point, {
      segments: true,
      stroke: true,
      tolerance: 5,
    });

    if (hitResult) {
      if (hitResult.type === "segment") {
        selectedSegment = hitResult.segment;
        activeKnot = hitResult.item;
      } else if (hitResult.type === "stroke") {
        const location = hitResult.location;
        selectedSegment = hitResult.item.insert(location.index + 1, point);
        activeKnot = hitResult.item;
      }
    }
  }
}

function onMouseDrag(event) {
  if (isDrawing && currentPath) {
    currentPath.add(event.point);
  } else if (selectedSegment) {
    const delta = event.point.subtract(lastMousePoint);
    selectedSegment.point = selectedSegment.point.add(delta);
    lastMousePoint = event.point;
    highlightIntersections();
    paper.view.update();
  }
}

function onMouseUp(event) {
  if (isDrawing && currentPath) {
    currentPath.simplify(10);
    currentPath.closed = true;
    currentPath = null;
  }
  selectedSegment = null;
  lastMousePoint = null;
  highlightIntersections();
}

function onKeyDown(event) {
  if (event.key === "d") {
    isDrawing = !isDrawing;
    if (isDrawing) {
      selectedSegment = null;
      activeKnot = null;
    }
    console.log(isDrawing ? "Drawing mode" : "Edit mode");
  } else if (event.key === "c") {
    paper.project.clear();
    currentPath = null;
    activeKnot = null;
    selectedSegment = null;
    intersectionDots.forEach((dot) => dot.remove());
    intersectionDots = [];
    console.log("Canvas cleared");
  }
}

const tool = new paper.Tool();
tool.onMouseDown = onMouseDown;
tool.onMouseDrag = onMouseDrag;
tool.onMouseUp = onMouseUp;

window.addEventListener("keydown", onKeyDown);

window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  paper.view.viewSize = new paper.Size(window.innerWidth, window.innerHeight);
  highlightIntersections();
});
