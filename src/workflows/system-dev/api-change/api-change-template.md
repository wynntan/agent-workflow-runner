# API Change Requirement

## Goal

どのAPI契約をどう変えたいか。

## Background

変更理由。新機能、仕様変更、互換性、利用者要望など。

## API Surface

- endpoint / route
- method
- request schema
- response schema
- error behavior
- generated types or clients

## Compatibility

- 後方互換性の要否
- migration方針
- deprecation方針

## Scope

今回変更するAPI、型、docs、tests。

## Out of Scope

今回変えないAPIやclient。

## Acceptance Criteria

- API契約が期待どおり変更される
- 既存互換性要件を満たす
- tests/docs/schemaが整合する

## Constraints

- versioning
- client互換性
- 認証/権限
- データmigration

## Validation

- 実行してほしい検証コマンド
- API動作確認手順

## Notes

OpenAPI/schema、関連issue、client影響、参考URLなど。
