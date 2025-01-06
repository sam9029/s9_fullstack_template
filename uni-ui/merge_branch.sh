#!/bin/bash

# 改变当前工作目录到指定路径
cd /c/project/uni/koc-duolai-uni-mp || { echo "错误：无法切换到指定目录 /c/project/uni/koc-duolai-uni-mp"; exit 1; }

# 定义要合并的feature分支列表
FEATURE_BRANCHES=("feature/tiantian" "feature/duolai" "feature/dy-heiyan" "feature/ks-duokandian" "feature/ks-xingguang" "feature/dy-wanhua" "feature/dy-zhonggu")

# 初始化合并结果表格
MERGE_RESULT=()

# 遍历分支列表并尝试合并
for BRANCH in "${FEATURE_BRANCHES[@]}"; do
    echo "正在合并 master 到 $BRANCH 分支..."
    # 尝试切换到目标分支
    if ! git checkout "$BRANCH"; then
        echo "错误：无法切换到分支 $BRANCH。"
        MERGE_RESULT+=("$BRANCH: 错误：无法切换到分支$BRANCH")
        continue
    fi
    
    # 尝试合并，如果合并失败（返回非0值），则打印错误信息并停留在当前分支
    if ! git merge --no-ff master; then
        echo "合并失败，存在冲突。请手动解决 $BRANCH 分支上的冲突。"
        MERGE_RESULT+=("$BRANCH: 合并失败，存在冲突。请手动解决$BRANCH 分支上的冲突。")
        continue
    else
        echo "合并成功，正在推送更改到远程仓库..."
        git push
        if ! git push; then
            echo "推送失败，请手动推送更改到远程仓库。"
            MERGE_RESULT+=("$BRANCH: 推送失败，请手动推送更改到远程仓库。")
        else
            echo "推送成功。"
            MERGE_RESULT+=("$BRANCH: 推送成功。")
        fi
    fi
done

# 切换回 master 分支
echo "所有分支合并操作完成，切换回 master 分支..."
if ! git checkout master; then
    echo "错误：无法切换回 master 分支。"
    exit 1
else
    echo "已成功切换回 master 分支。"
fi

# 显示合并结果表格
echo "合并结果如下："
echo "----------------------------------------------"
for i in "${!MERGE_RESULT[@]}"; do
    echo "${MERGE_RESULT[$i]}" | awk '{print $1 " | "$2}'
done
