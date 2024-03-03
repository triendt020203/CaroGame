import {
  _decorator,
  Color,
  Component,
  instantiate,
  Label,
  Node,
  Prefab,
  Vec2,
  Vec3,
} from "cc";
import { GG_Cell } from "./GG_Cell";
const { ccclass, property } = _decorator;

@ccclass("GG_Game_Play")
export class GG_Game_Play extends Component {
  @property(Prefab)
  gg_cell: Prefab = null;

  @property(Label)
  gg_score: Label = null;

  // Số lượng ô vuông nhỏ trong background node cả cột và hàng đều chưa 20 ô vuông nhỏ
  private gg_size: number = 20;

  // Kích thước của ô vuông nhỏ được tính 700 / 20 = 35
  private gg_cellSize: number = 35;

  // Mảng chưa ma trận row và col
  private gg_matrix: any[] = [];

  // Biến xác định là người chơi được chọn X hay O để đánh trước
  private gg_isX: boolean = false;

  private gg_lastClickedRow: number = -1;

  private gg_lastClickedCol: number = -1;

  start() {
    this.init();
    this.node.on(Node.EventType.MOUSE_DOWN, this.onClick.bind(this));
  }

  onDestroy() {
    this.node.off(Node.EventType.MOUSE_DOWN, this.onClick.bind(this));
  }

  init() {
    this.gg_isX = true;
    this.gg_matrix = [];
    // Xác định việc khi bắt đầu trò chơi ma trận không chưa bất cứ một giá trị nào (Mảng trống)
    const emptyRow = new Array(this.gg_size).fill(null);
    for (let i = 0; i < this.gg_size; i++) {
      this.gg_matrix.push([...emptyRow]);
    }
  }

  onClick(e: any) {
    // Lấy ra vị trí click chuột xảy ra trong node (Ở đây là bàn cơ chứa các ô vuông nhỏ)
    const { x, y } = e.getUILocation();

    // Tính toán lấy vị trí của row và col
    const col = Math.floor(x / this.gg_cellSize);
    const row = this.gg_size - Math.floor(y / this.gg_cellSize) - 1;

    // Nếu mà ô đó đã chứa giá trị X hoặc O return luôn không xử lý gì cả
    if (this.gg_matrix[row][col]) {
      return;
    }
    this.gg_makeNewCell(row, col);

    this.gg_checkWin(row, col);
  }

  // Tạo các giá trị X và O tương ứng
  gg_makeNewCell(row: number, col: number) {
    const val = this.gg_isX ? "X" : "O";
    // Tính toán pixcel để khi tạo thì sẽ nằm ở chính giữa ô vuông
    let posPixcel = new Vec3(
      this.gg_cellSize * (col + 0.5),
      this.gg_cellSize * (this.gg_size - (row + 0.5))
    );
    this.gg_matrix[row][col] = val;
    const newCell = instantiate(this.gg_cell);
    newCell.setPosition(posPixcel);
    this.node.addChild(newCell);
    newCell.getComponent(GG_Cell).show(this.gg_isX);

    // Kiểm tra game win sau đó cộng thêm điểm mỗi 1 lần
    if (this.gg_checkWin(row, col)) {
      if (this.gg_score) {
        const currentScore = parseInt(this.gg_score.string) || 0;
        this.gg_score.string = (currentScore + 1).toString();
      }
    }

    this.gg_lastClickedRow = row;
    this.gg_lastClickedCol = col;

    if (this.gg_isX) {
      this.scheduleOnce(() => {
        this.gg_makeAutoMove();
      }, 0.2);
    }

    this.gg_isX = !this.gg_isX;
  }

  // Hàm này mô phỏng việc chơi với máy. Sau 0.2s thì sẽ tự động tạo O xung quanh vị trí mà người dùng đã tạo
  gg_makeAutoMove() {
    const adjacentCells = this.gg_getAdjacentCells(
      this.gg_lastClickedRow,
      this.gg_lastClickedCol
    );

    if (adjacentCells.length > 0) {
      const randomIndex = Math.floor(Math.random() * adjacentCells.length);
      const { row, col } = adjacentCells[randomIndex];
      this.gg_makeNewCell(row, col);
    }
  }

  gg_getAdjacentCells(
    row: number,
    col: number
  ): { row: number; col: number }[] {
    const adjacentCells: { row: number; col: number }[] = [];

    // Duyệt qua tất cả các ô cờ xung quanh ô cờ có tọa độ (row, col)
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        // Kiểm tra xem ô cờ mới có nằm trong giới hạn của bàn cờ và không đã được đánh chưa
        if (
          this.gg_isInBounds(newRow, newCol) &&
          !this.gg_matrix[newRow][newCol]
        ) {
          adjacentCells.push({ row: newRow, col: newCol });
        }
      }
    }

    return adjacentCells;
  }

  // Check xem người dùng đã chiến thắng hay chưa 5 ô liền kề nhau có cùng X hoặc O thì sẽ được tính điểm
  gg_checkWin(row: number, col: number): boolean {
    const val = this.gg_matrix[row][col];

    // Kiểm tra hàng
    if (
      this.gg_checkInARow(row, col, 1, 0, val) ||
      this.gg_checkInARow(row, col, -1, 0, val)
    ) {
      return true;
    }

    // Kiểm tra cột
    if (
      this.gg_checkInARow(row, col, 0, 1, val) ||
      this.gg_checkInARow(row, col, 0, -1, val)
    ) {
      return true;
    }

    // Kiểm tra đường chéo chính (\)
    if (
      this.gg_checkInARow(row, col, 1, 1, val) ||
      this.gg_checkInARow(row, col, -1, -1, val)
    ) {
      return true;
    }

    // Kiểm tra đường chéo phụ (/)
    if (
      this.gg_checkInARow(row, col, 1, -1, val) ||
      this.gg_checkInARow(row, col, -1, 1, val)
    ) {
      return true;
    }

    return false;
  }

  gg_checkInARow(
    row: number,
    col: number,
    rowDir: number,
    colDir: number,
    val: string
  ): boolean {
    let count = 1; // Số lượng ô đã kiểm tra

    // Kiểm tra xuôi theo hướng (rowDir, colDir)
    for (let i = 1; i <= 4; i++) {
      const nextRow = row + i * rowDir;
      const nextCol = col + i * colDir;

      if (
        this.gg_isInBounds(nextRow, nextCol) &&
        this.gg_matrix[nextRow][nextCol] === val
      ) {
        count++;
      } else {
        break;
      }
    }

    // Kiểm tra ngược theo hướng (-rowDir, -colDir)
    for (let i = 1; i <= 4; i++) {
      const prevRow = row - i * rowDir;
      const prevCol = col - i * colDir;

      if (
        this.gg_isInBounds(prevRow, prevCol) &&
        this.gg_matrix[prevRow][prevCol] === val
      ) {
        count++;
      } else {
        break;
      }
    }

    return count >= 5;
  }

  // Kiểm tra xem X hoặc O có nằm trong kích thước bàn cờ 20x20 không
  gg_isInBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.gg_size && col >= 0 && col < this.gg_size;
  }
}
