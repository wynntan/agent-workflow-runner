# Dependency Upgrade Request

## Goal

どの依存関係を何のために更新したいか。

## Target Dependencies

- package名
- 現在version
- 希望versionまたは範囲

## Background

更新理由。脆弱性、機能利用、互換性、保守など。

## Scope

今回更新する依存関係と関連ファイル。

## Out of Scope

更新しない依存関係、やらないmigration。

## Acceptance Criteria

- 対象依存が指定version/rangeへ更新される
- lockfileが整合する
- 既存機能が壊れていない

## Constraints

- package manager
- Node/runtime version
- breaking changeの許容範囲

## Validation

- 実行してほしい検証コマンド
- 起動確認や手動確認が必要な場合はその手順

## Notes

changelog、migration guide、関連issue、参考URLなど。
