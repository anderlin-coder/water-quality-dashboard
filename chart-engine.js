/**
 * 圖表生成引擎
 * 按照標準圖例格式生成分類對比圖表
 */

let chartInstances = [];

/**
 * 生成標準格式的圖表
 * 按分類分別顯示子圖
 */
function generateStandardCharts(data, metric) {
    // 清除舊圖表
    destroyAllCharts();
    
    // 按分類分組
    const grouped = groupDataByCategory(data);
    const container = document.getElementById('chartsContainer');
    container.innerHTML = '';
    
    // 獲取所有日期
    const allDates = new Set();
    data.forEach(d => allDates.add(d.dateStr));
    const dates = Array.from(allDates).sort();
    
    // 為每個分類生成一個圖表
    CATEGORY_ORDER.forEach(category => {
        if (!grouped[category] || Object.keys(grouped[category]).length === 0) {
            return;
        }
        
        const categoryData = grouped[category];
        const sites = Object.keys(categoryData).sort((a, b) => {
            const indexA = SITE_ORDER.indexOf(a);
            const indexB = SITE_ORDER.indexOf(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        });
        
        // 創建圖表容器
        const section = document.createElement('div');
        section.className = 'chart-section';
        
        const title = document.createElement('h3');
        title.textContent = `${metric === 'temperature' ? '水溫' : 
                            metric === 'pH' ? 'pH值' :
                            metric === 'conductivity' ? '導電度' :
                            metric === 'dissolvedOxygen' ? '溶氧' :
                            '濁度'} 詳細趨勢分析圖 (-) - 類別: ${category}`;
        section.appendChild(title);
        
        const wrapper = document.createElement('div');
        wrapper.className = 'chart-wrapper';
        
        const canvas = document.createElement('canvas');
        canvas.id = `chart-${category}`;
        wrapper.appendChild(canvas);
        section.appendChild(wrapper);
        
        container.appendChild(section);
        
        // 準備圖表數據
        const datasets = [];
        
        sites.forEach((site, index) => {
            const siteData = categoryData[site];
            const values = dates.map(date => {
                const record = siteData.find(d => d.dateStr === date);
                return record ? record[metric] : null;
            });
            
            datasets.push({
                label: site,
                data: values,
                borderColor: COLORS[site] || `hsl(${index * 30}, 70%, 50%)`,
                backgroundColor: 'transparent',
                borderWidth: 2,
                tension: 0.1,
                pointRadius: 4,
                pointHoverRadius: 6,
                pointBackgroundColor: COLORS[site] || `hsl(${index * 30}, 70%, 50%)`,
                pointBorderColor: '#fff',
                pointBorderWidth: 1
            });
        });
        
        // 創建圖表
        const ctx = canvas.getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: dates,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        padding: 12,
                        titleFont: { size: 13 },
                        bodyFont: { size: 12 },
                        callbacks: {
                            label: function(context) {
                                return context.dataset.label + ': ' + 
                                       (context.parsed.y !== null ? context.parsed.y.toFixed(2) : 'N/A');
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            drawBorder: true,
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            font: { size: 11 }
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            display: true,
                            drawBorder: true,
                            color: 'rgba(0,0,0,0.1)'
                        },
                        ticks: {
                            font: { size: 11 }
                        },
                        title: {
                            display: true,
                            text: getMetricName(metric),
                            font: { size: 12 }
                        }
                    }
                }
            }
        });
        
        chartInstances.push(chart);
    });
}

/**
 * 銷毀所有圖表實例
 */
function destroyAllCharts() {
    chartInstances.forEach(chart => {
        if (chart) {
            chart.destroy();
        }
    });
    chartInstances = [];
}

/**
 * 導出圖表為 PNG
 */
function exportChartAsPNG(chartId, filename) {
    const canvas = document.getElementById(chartId);
    if (!canvas) {
        alert('圖表不存在');
        return;
    }
    
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = filename || 'chart.png';
    link.click();
}

/**
 * 導出所有圖表
 */
function exportAllCharts() {
    const timestamp = new Date().toISOString().split('T')[0];
    const metric = document.getElementById('metricSelect').value;
    
    chartInstances.forEach((chart, index) => {
        const canvas = chart.canvas;
        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `water-quality-${metric}-${index}.png`;
        
        // 延遲導出，避免瀏覽器限制
        setTimeout(() => link.click(), index * 500);
    });
}
