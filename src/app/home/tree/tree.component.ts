import { FlatTreeControl } from '@angular/cdk/tree';
import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';

interface Node{
  name: string,
  children?: Node[]
}
interface FlatNode {
  expandable: boolean;
  name: string;
  level: number;
}

@Component({
  selector: 'app-tree',
  templateUrl: './tree.component.html',
  styleUrls: ['./tree.component.css']
})
export class TreeComponent implements OnInit, OnDestroy {
  @Input() tree!: Node[];

  private _transformer = (node: Node, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      name: node.name,
      level: level,
    };
  };
  treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable,
  );
  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );
  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);


  constructor() { }

  ngOnInit(): void {
    this.dataSource.data = this.tree;
  }
  ngOnDestroy(): void {
    console.log('Tree destroyed');
  }

  hasChild = (_: number, node: FlatNode) => node.expandable;
}
