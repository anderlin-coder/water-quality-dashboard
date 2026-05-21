/**
 * 主應用程式邏輯
 */

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    setDefaultDates();
    updateSiteCheckboxes();
    updateCategoryCheckboxes();
});

/**
 * 設置默認日期（最近 90 天）
 */
function setDefaultDates() {
    const today = new Date();
    const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    document.getElementById('endDate').valueAsDate = today;
    document.getElementById('startDate').valueAsDate = ninetyDaysAgo;
}

/**
 * 切換標籤頁
 */
function switchTab(tabName) {
    // 隱藏所有標籤內容
    document.querySelectorAll('.tab-content').forEach(el => {
        el.classList.remove('active');
    });
    
    // 移除所有按鈕的活動狀態
    document.querySelectorAll('.tab-button').forEach(el => {
        el.classList.remove('active');
    });
    
    // 顯示選定的標籤
    document.getElementById(tabName).classList.add('active');
    
    // 標記按鈕為活動
    event.target.classList.add('active');
}

/**
 * 導入 CSV 數據
 */
function importData() {
    const fileInput = document.getElementById('csvFile');
    const file = fileInput.files[0];
    
    if (!file) {
        showStatus('importStatus', '請選擇檔案', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvData = e.target.result;
        
        showStatus('importStatus', '正在導入...', 'info');
        
        importCsvData(csvData)
            .then(result => {
                showStatus('importStatus', result.message, 'success');
                fileInput.value = '';
                
                // 更新複選框
                updateSiteCheckboxes();
                updateCategoryCheckboxes();
                
                // 顯示數據預覽
                showDataPreview();
            })
            .catch(error => {
                showStatus('importStatus', error.message, 'error');
            });
    };
    
    reader.readAsText(file);
}

/**
 * 更新監測點複選框
 */
function updateSiteCheckboxes() {
    const sites = getSites();
    const container = document.getElementById('siteCheckboxes');
    container.innerHTML = '';
    
    sites.forEach(site => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `site_${site}`;
        checkbox.value = site;
        checkbox.className = 'site-checkbox';
        
        const label = document.createElement('label');
        label.htmlFor = `site_${site}`;
        label.textContent = site;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

/**
 * 更新分類複選框
 */
function updateCategoryCheckboxes() {
    const categories = getCategories();
    const container = document.getElementById('categoryCheckboxes');
    container.innerHTML = '';
    
    categories.forEach(cat => {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `cat_${cat}`;
        checkbox.value = cat;
        checkbox.className = 'category-checkbox';
        
        const label = document.createElement('label');
        label.htmlFor = `cat_${cat}`;
        label.textContent = cat;
        
        div.appendChild(checkbox);
        div.appendChild(label);
        container.appendChild(div);
    });
}

/**
 * 獲取選定的監測點
 */
function getSelectedSites() {
    return Array.from(document.querySelectorAll('.site-checkbox:checked')).map(el => el.value);
}

/**
 * 獲取選定的分類
 */
function getSelectedCategories() {
    return Array.from(document.querySelectorAll('.category-checkbox:checked')).map(el => el.value);
}

/**
 * 生成圖表
 */
function generateChart() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const sites = getSelectedSites();
    const categories = getSelectedCategories();
    const metric = document.getElementById('metricSelect').value;
    
    if (!startDate || !endDate) {
        showStatus('analysisStatus', '❌ 請選擇日期範圍', 'error');
        return;
    }
    
    if (allData.length === 0) {
        showStatus('analysisStatus', '❌ 請先導入數據', 'error');
        return;
    }
    
    showLoading('analysisLoading', true);
    
    try {
        // 篩選數據
        const filteredData = filterData(startDate, endDate, sites, categories);
        
        if (filteredData.length === 0) {
            showLoading('analysisLoading', false);
            showStatus('analysisStatus', '⚠️ 篩選條件下無數據', 'error');
            return;
        }
        
        // 生成圖表
        setTimeout(() => {
            generateStandardCharts(filteredData, metric);
            showLoading('analysisLoading', false);
            showStatus('analysisStatus', '✓ 圖表已生成', 'success');
        }, 100);
    } catch (error) {
        showLoading('analysisLoading', false);
        showStatus('analysisStatus', `❌ 生成失敗: ${error.message}`, 'error');
        console.error(error);
    }
}

/**
 * 生成統計報告
 */
function generateStatistics() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    const sites = getSelectedSites();
    const categories = getSelectedCategories();
    
    if (!startDate || !endDate) {
        showStatus('reportStatus', '❌ 請選擇日期範圍', 'error');
        return;
    }
    
    if (allData.length === 0) {
        showStatus('reportStatus', '❌ 請先導入數據', 'error');
        return;
    }
    
    showLoading('reportLoading', true);
    
    try {
        const filteredData = filterData(startDate, endDate, sites, categories);
        
        if (filteredData.length === 0) {
            showLoading('reportLoading', false);
            showStatus('reportStatus', '⚠️ 篩選條件下無數據', 'error');
            return;
        }
        
        let report = generateReport(filteredData, startDate, endDate);
        
        showLoading('reportLoading', false);
        document.getElementById('reportContent').textContent = report;
        showStatus('reportStatus', '✓ 統計報告已生成', 'success');
    } catch (error) {
        showLoading('reportLoading', false);
        showStatus('reportStatus', `❌ 生成失敗: ${error.message}`, 'error');
        console.error(error);
    }
}

/**
 * 生成報告文本
 */
function generateReport(data, startDate, endDate) {
    let report = `水質數據統計報告\n`;
    report += `生成時間: ${new Date().toLocaleString('zh-TW')}\n`;
    report += `\n`;
    
    report += `=== 數據概覽 ===\n`;
    report += `時間範圍: ${startDate} 至 ${endDate}\n`;
    report += `監測點數: ${new Set(data.map(d => d.site)).size}\n`;
    report += `採樣記錄數: ${data.length}\n`;
    report += `\n`;
    
    report += `=== 各指標統計 ===\n\n`;
    
    const metrics = [
        { key: 'temperature', name: '水溫 (℃)' },
        { key: 'pH', name: 'pH 值' },
        { key: 'conductivity', name: '導電度 (μmho/cm)' },
        { key: 'dissolvedOxygen', name: '溶氧 (mg/L)' },
        { key: 'turbidity', name: '濁度 (NTU)' }
    ];
    
    metrics.forEach(m => {
        const stats = calculateStatistics(data, m.key);
        if (stats.count > 0) {
            report += `${m.name}\n`;
            report += `  平均值: ${stats.mean}\n`;
            report += `  最小值: ${stats.min}\n`;
            report += `  最大值: ${stats.max}\n`;
            report += `  標準差: ${stats.std}\n`;
            report += `  樣本數: ${stats.count}\n\n`;
        }
    });
    
    report += `=== 分類分析 ===\n\n`;
    
    const grouped = groupDataByCategory(data);\n    const categories = getCategories();\n    \n    categories.forEach(cat => {\n        if (!grouped[cat] || Object.keys(grouped[cat]).length === 0) return;\n        \n        const catData = grouped[cat];\n        const catRecords = data.filter(d => d.category === cat);\n        \n        report += `${cat}\\n`;\n        report += `  監測點數: ${Object.keys(catData).length}\\n`;\n        report += `  記錄數: ${catRecords.length}\\n`;\n        report += `  監測點: ${Object.keys(catData).sort((a, b) => {\\n            const indexA = SITE_ORDER.indexOf(a);\\n            const indexB = SITE_ORDER.indexOf(b);\\n            return indexA - indexB;\\n        }).join(', ')}\\n\\n`;\n    });\n    \n    report += `=== 監測點詳細統計 ===\\n\\n`;\n    \n    const sites = getSites();\n    sites.forEach(site => {\n        const siteData = data.filter(d => d.site === site);\n        if (siteData.length === 0) return;\n        \n        report += `${site} (${SITE_CATEGORY_MAP[site] || '未分類'})\\n`;\n        \n        metrics.forEach(m => {\n            const stats = calculateStatistics(siteData, m.key);\n            if (stats.count > 0) {\n                report += `  ${m.name}: 平均 ${stats.mean}, 範圍 ${stats.min}~${stats.max}\\n`;\n            }\n        });\n        \n        report += `\\n`;\n    });\n    \n    return report;\n}\n\n/**\n * 顯示數據預覽\n */\nfunction showDataPreview() {\n    const preview = getDataPreview(10);\n    const previewDiv = document.getElementById('dataPreview');\n    const contentDiv = document.getElementById('previewContent');\n    \n    if (preview.length === 0) {\n        previewDiv.style.display = 'none';\n        return;\n    }\n    \n    let html = '<table><thead><tr>';\n    html += '<th>採樣日期</th><th>監測點</th><th>分類</th><th>水溫</th><th>pH</th><th>導電度</th><th>溶氧</th><th>濁度</th>';\n    html += '</tr></thead><tbody>';\n    \n    preview.forEach(row => {\n        html += '<tr>';\n        html += `<td>${row.dateStr}</td>`;\n        html += `<td>${row.site}</td>`;\n        html += `<td>${row.category}</td>`;\n        html += `<td>${row.temperature !== null ? row.temperature.toFixed(2) : '-'}</td>`;\n        html += `<td>${row.pH !== null ? row.pH.toFixed(2) : '-'}</td>`;\n        html += `<td>${row.conductivity !== null ? row.conductivity.toFixed(2) : '-'}</td>`;\n        html += `<td>${row.dissolvedOxygen !== null ? row.dissolvedOxygen.toFixed(2) : '-'}</td>`;\n        html += `<td>${row.turbidity !== null ? row.turbidity.toFixed(2) : '-'}</td>`;\n        html += '</tr>';\n    });\n    \n    html += '</tbody></table>';\n    contentDiv.innerHTML = html;\n    previewDiv.style.display = 'block';\n}\n\n/**\n * 顯示狀態訊息\n */\nfunction showStatus(elementId, message, type) {\n    const el = document.getElementById(elementId);\n    el.innerHTML = `<div class=\"status-message ${type}\">${message}</div>`;\n}\n\n/**\n * 顯示/隱藏加載指示器\n */\nfunction showLoading(elementId, show) {\n    const el = document.getElementById(elementId);\n    if (show) {\n        el.style.display = 'block';\n    } else {\n        el.style.display = 'none';\n    }\n}\n
