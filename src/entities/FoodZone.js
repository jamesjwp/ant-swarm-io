export default class FoodZone {
  constructor(scene, x, y, width, height, fields) {
    this.fields = fields;
    this.bounds = new Phaser.Geom.Rectangle(
      x - width  / 2,
      y - height / 2,
      width,
      height,
    );
  }

  containsPoint(x, y) {
    return this.bounds.contains(x, y);
  }

  getAvailableField(px, py) {
    const available = this.fields.filter(f => f.isAvailable);
    if (available.length === 0) return null;
    available.sort((a, b) =>
      Math.hypot(a.x - px, a.y - py) - Math.hypot(b.x - px, b.y - py)
    );
    return available[0];
  }
}
