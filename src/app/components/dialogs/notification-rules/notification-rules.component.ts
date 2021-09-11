import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import _ from 'lodash';
import { UserService } from 'src/app/services/user/user.service';
import { AxieCountRule, DefaultAxieCountRule, DefaultSLPRule, Rule, RuleType, SLPRule } from 'src/app/_models/rule';

@Component({
  selector: 'app-notification-rules',
  templateUrl: './notification-rules.component.html',
  styleUrls: ['./notification-rules.component.scss']
})
export class NotificationRulesComponent {
  notificationRules?:  Record<string, Rule>;
  ruleType = RuleType;
  rules: Rule[];

  constructor(
    public dialogRef: MatDialogRef<NotificationRulesComponent>,
    private userService: UserService) {
      this.userService.currentUser$().subscribe((user) => {
        this.notificationRules = !_.isEmpty(user.notificationRules) ? {..._.cloneDeep(user.notificationRules)} : {};
        this.rules = Object.values(this.notificationRules);
      });
    }

  onNoClick(): void {
    this.dialogRef.close();
  }

  addSLPRule(): void {
    if(!!this.notificationRules) {
      const newRule = DefaultSLPRule();
      this.notificationRules[newRule.id] = newRule;
      this.rules.push(newRule);
    }
  }

  addAxieRule(): void {
    if(!!this.notificationRules) {
      const newRule = DefaultAxieCountRule();
      this.notificationRules[newRule.id] = newRule;
      this.rules.push(newRule);
    }
  }

  reset(): void {
    this.notificationRules = {};
    this.rules = [];
  }
}
