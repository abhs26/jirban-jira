import {Component, EventEmitter, Input, View} from 'angular2/core';
import {BoardData} from '../../../data/board/boardData';
import {IssueData} from '../../../data/board/issueData';
import {IssuesService} from '../../../services/issuesService';
import {IssueComponent} from '../issue/issue';

@Component({
    inputs: ['data'],
    outputs: ['closeContextMenu'],
    selector: 'issue-context-menu'
})
@View({
    templateUrl: 'app/components/board/issueContextMenu/issueContextMenu.html',
    styleUrls: ['app/components/board/issueContextMenu/issueContextMenu.css'],
    directives: [IssueComponent]
})
export class IssueContextMenuComponent {
    private _data:IssueContextMenuData;
    private showContext:boolean = false;
    private issue:IssueData;
    private endIssue:boolean;
    private toState:string;
    private issuesForState:IssueData[];
    private movePanelTop:number;
    private movePanelLeft:number;

    private insertBeforeIssueKey:string;

    private move:boolean;

    private closeContextMenu:EventEmitter<any> = new EventEmitter();

    constructor(private boardData:BoardData, private issuesService:IssuesService) {
        this.setWindowSize();
    }

    private set data(data:IssueContextMenuData) {
        this.showContext = !!data;
        this.move = false;
        this.toState = null;
        this.issue = null;
        this.endIssue = false;
        this.issuesForState = null;
        this.insertBeforeIssueKey = null;
        this._data = data;
        this.issue = null;
        if (data) {
            this.issue = this.boardData.getIssue(data.issueKey);
            this.toState = this.issue.boardStatus;
            this.issuesForState = this.boardData.getValidMoveBeforeIssues(this.issue.key, this.toState);
        }


    }

    private clearMoveMenu() {
        this.move = false;
    }

    private get data() {
        return this._data;
    }

    private get displayContextMenu() : boolean {
        return !!this._data && !!this.issue && this.showContext;
    }

    private get moveStates() : string[] {
        return this.boardData.boardStates;
    }

    private isValidState(state:string) : boolean {
        return this.boardData.isValidStateForProject(this.issue.projectCode, state);
    }

    private onShowMovePanel(event:MouseEvent) {
        event.preventDefault();
        this.showContext = false;
        this.move = true;
    }

    private onSelectMoveState(event:MouseEvent, toState:string) {
        event.preventDefault();
        this.issuesForState = this.boardData.getValidMoveBeforeIssues(this.issue.key, toState);
        this.toState = toState;
    }

    private onSelectMoveIssue(event:MouseEvent, beforeIssueKey:string) {
        console.log("onSelectMoveIssue - " + beforeIssueKey)
        event.preventDefault();
        this.insertBeforeIssueKey = beforeIssueKey;

        if (this.issue.key == beforeIssueKey) {
            //If we are moving to ourself just abort
            console.log("onSelectMoveIssue - key is self, returning")
            this.clearMoveMenu();
            return;
        }

        let beforeKey:string = beforeIssueKey === "" ? null : beforeIssueKey;
        let afterKey:string;
        if (!beforeKey && this.issuesForState.length > 0) {
            afterKey = this.issuesForState[this.issuesForState.length - 1].key;
        }
        console.log("onSelectMoveIssue key - afterKey " + afterKey);

        //Tell the server to move the issue. The actual move will come in via the board's web socket since the actions
        //are queued on the server and once done the changes are broadcast to everyone connected.
        this.issuesService.moveIssue(this.boardData.boardName, this.issue.key, this.toState, beforeKey, afterKey)
            .subscribe(
                data => {
                    console.log("Executed move!");
                }
                ,
                err => {
                    console.error(err);
                },
                () => {
                    console.log('request completed')
                    this.clearMoveMenu();
                }
            );

        console.log("insertBeforeIssueKey " + this.insertBeforeIssueKey);
    }

    private onResize(event : any) {
        this.setWindowSize();
    }

    private setWindowSize() {
        let movePanelTop,movePanelLeft : number = 0;
        //css hardcodes the height as 350px
        if (window.innerHeight > 350) {
            movePanelTop = window.innerHeight/2 - 350/2;
        }
        //css hardcodes the width as 720px;
        if (window.innerWidth > 720) {
            movePanelLeft = window.innerWidth/2 - 720/2;
        }
        this.movePanelTop = movePanelTop;
        this.movePanelLeft = movePanelLeft;
    }

    private isIssueSelected(issue:IssueData) : boolean {
        if (this.insertBeforeIssueKey) {
            return issue.key === this.insertBeforeIssueKey;
        }
        return this.issue.key == issue.key;
    }


    private onClickClose(event:MouseEvent) {
        this.closeContextMenu.emit({});
        event.preventDefault();
    }
}

export class IssueContextMenuData {
    constructor(private _issueKey:string,
                private _x:number,
                private _y:number) {
    }

    get issueKey():string {
        return this._issueKey;
    }

    get x():number {
        return this._x;
    }

    get y():number {
        return this._y;
    }
}
