import { _decorator, Component, Label, Node } from "cc";
const { ccclass, property } = _decorator;

@ccclass("GG_Cell")
export class GG_Cell extends Component {
  @property(Label)
  gg_lbX: Label = null;

  @property(Label)
  gg_lbO: Label = null;

  show(isX: boolean) {
    this.gg_lbX.node.active = isX;
    this.gg_lbO.node.active = !isX;
  }
}
