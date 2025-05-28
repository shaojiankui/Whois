# 代码提交阶段流程规范
## 代码审查
1. 提交代码前，必须参考 rules `r-code-review.mdc` 中的规则进行全面的代码审查
2. 确保所有问题都得到解决后，方可进入下一步

## SOP生成（可选）
1. 询问用户是否需要将本次提交总结为标准操作流程（SOP）
2. 如果用户需要，参考 rules `r-summary-sop.mdc` 中的规则生成SOP
3. 将生成的SOP保存到 `./cursor/rules/develop` 目录下，文件名格式为 `d-gen-{自动分析功能生成的描述}.mdc`，例如 `d-gen-api-user-authentication.mdc`

## 最终提交
1. 确保代码审查和SOP生成（如有需要）都已完成
2. 代码提交参考 rules `r-git-commit.mdc`执行
3. 询问用户是否要推送到远端