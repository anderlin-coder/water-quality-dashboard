/**
 * 數據管理模組
 * 負責數據的導入、存儲、篩選和檢索
 */

// 全局數據存儲
let allData = [];

// 監測點排序定義 - 按 1~10 排序
const SITE_ORDER = [
    "MW-01", "DW-02", "MW-03", "DW-04", "MW-05",
    "MW-06", "MW-07", "MW-08", "MW-09", "DW-10"
];

// 分類順序
const CATEGORY_ORDER = ["地面水", "滲出水", "地下水"];

// 監測點分類映射
const SITE_CATEGORY_MAP = {
    "MW-01": "地下水", "DW-02": "地下水", "MW-03": "地下水", "DW-04": "地下水",
    "MW-05": "地下水", "MW-06": "地下水", "MW-07": "地下水", "MW-08": "地下水",
    "MW-09": "地下水", "DW-10": "地下水",
    "上池": "地面水", "下池": "地面水",
    "左溝": "滲出水", "右溝": "滲出水"
};

// 顏色定義 - 按監測點順序
const COLORS = {
    "MW-01": "#1f77b4",  // 藍色
    "DW-02": "#ff7f0e",  // 橙色
    "MW-03": "#2ca02c",  // 綠色
    "DW-04": "#d62728",  // 紅色
    "MW-05": "#9467bd",  // 紫色
    "MW-06": "#8c564b",  // 棕色
    "MW-07": "#e377c2",  // 粉紅色
    "MW-08": "#7f7f7f",  // 灰色
    "MW-09": "#bcbd22",  // 黃綠色
    "DW-10": "#17becf",  // 青色
    "上池": "#1f77b4",   // 藍色
    "下池": "#ff7f0e",   // 橙色
    "左溝": "#2ca02c",   // 綠色
    "右溝": "#d62728"    // 紅色
};

/**
 * 導入 CSV 數據
 */
function importCsvData(csvContent) {
    return new Promise((resolve, reject) => {
        Papa.parse(csvContent, {
            header: true,
            skipEmptyLines: true,
            complete: function(results) {
                try {
                    allData = [];
                    
                    results.data.forEach((row, index) => {
                        if (!row["採樣日期"]) return;
                        
                        const dateStr = row["採樣日期"].trim();
                        const date = parseDate(dateStr);
                        
                        if (isNaN(date.getTime())) {
                            console.warn(`第 ${index + 2} 行日期格式錯誤: ${dateStr}`);
                            return;
                        }
                        
                        const site = row["監測點"]?.trim() || "";
                        const category = row["分類"]?.trim() || SITE_CATEGORY_MAP[site] || "";
                        
                        const dataPoint = {
                            date: date,
                            dateStr: date.toISOString().split('T')[0],
                            site: site,
                            category: category,
                            temperature: parseFloat(row["水溫(℃)"]) || null,
                            pH: parseFloat(row["pH值"]) || null,
                            conductivity: parseFloat(row["導電度(μmho/cm)"]) || null,
                            dissolvedOxygen: parseFloat(row["溶氧(mg/L)"]) || null,
                            turbidity: parseFloat(row["濁度(NTU)"]) || null
                        };
                        
                        allData.push(dataPoint);
                    });
                    
                    // 按日期排序
                    allData.sort((a, b) => a.date - b.date);
                    
                    resolve({
                        success: true,
                        count: allData.length,
                        message: `成功導入 ${allData.length} 筆數據`
                    });
                } catch (error) {
                    reject({
                        success: false,
                        message: `導入失敗: ${error.message}`
                    });
                }
            },
            error: function(error) {
                reject({
                    success: false,
                    message: `CSV 解析失敗: ${error.message}`
                });
            }
        });
    });
}

/**
 * 解析日期字符串
 */
function parseDate(dateStr) {
    // 嘗試多種日期格式
    const formats = [
        /^(\d{4})-(\d{2})-(\d{2})$/,  // YYYY-MM-DD
        /^(\d{4})\/(\d{2})\/(\d{2})$/, // YYYY/MM/DD
        /^(\d{2})\/(\d{2})\/(\d{4})$/  // MM/DD/YYYY
    ];
    
    for (let format of formats) {
        const match = dateStr.match(format);
        if (match) {
            if (match[1].length === 4) {
                return new Date(match[1], match[2] - 1, match[3]);
            } else {
                return new Date(match[3], match[1] - 1, match[2]);
            }
        }
    }
    
    // 嘗試直接解析
    const date = new Date(dateStr);
    return date;
}

/**
 * 獲取所有監測點（按順序）
 */
function getSites() {
    const sites = new Set();
    allData.forEach(d => {
        if (d.site) sites.add(d.site);
    });
    
    // 按定義的順序排序
    return Array.from(sites).sort((a, b) => {
        const indexA = SITE_ORDER.indexOf(a);
        const indexB = SITE_ORDER.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
}

/**
 * 獲取所有分類
 */
function getCategories() {
    const categories = new Set();
    allData.forEach(d => {
        if (d.category) categories.add(d.category);
    });
    
    // 按定義的順序排序
    return Array.from(categories).sort((a, b) => {
        const indexA = CATEGORY_ORDER.indexOf(a);
        const indexB = CATEGORY_ORDER.indexOf(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    });
}

/**
 * 篩選數據
 */
function filterData(startDate, endDate, selectedSites, selectedCategories) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    return allData.filter(d => {
        if (d.date < start || d.date > end) return false;
        if (selectedSites.length > 0 && !selectedSites.includes(d.site)) return false;
        if (selectedCategories.length > 0 && !selectedCategories.includes(d.category)) return false;
        return true;
    });
}

/**
 * 按分類和監測點分組數據
 */
function groupDataByCategory(data) {
    const grouped = {};
    
    CATEGORY_ORDER.forEach(category => {
        grouped[category] = {};
    });
    
    data.forEach(d => {
        if (!grouped[d.category]) {
            grouped[d.category] = {};
        }
        if (!grouped[d.category][d.site]) {
            grouped[d.category][d.site] = [];
        }
        grouped[d.category][d.site].push(d);
    });
    
    return grouped;
}

/**
 * 獲取數據預覽
 */
function getDataPreview(limit = 10) {
    return allData.slice(0, limit);
}

/**
 * 計算統計信息
 */
function calculateStatistics(data, metric) {
    if (!data || data.length === 0) {
        return {
            count: 0,
            mean: null,
            min: null,
            max: null,
            std: null
        };
    }
    
    const values = data
        .map(d => d[metric])
        .filter(v => v !== null && v !== undefined && !isNaN(v));
    
    if (values.length === 0) {
        return {
            count: 0,
            mean: null,
            min: null,
            max: null,
            std: null
        };
    }
    
    const mean = values.reduce((a, b) => a + b) / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);
    
    return {
        count: values.length,
        mean: parseFloat(mean.toFixed(2)),
        min: parseFloat(min.toFixed(2)),
        max: parseFloat(max.toFixed(2)),
        std: parseFloat(std.toFixed(2))
    };
}

/**
 * 獲取指標的中文名稱
 */
function getMetricName(metric) {
    const names = {
        "temperature": "水溫 (℃)",
        "pH": "pH 值",
        "conductivity": "導電度 (μmho/cm)",
        "dissolvedOxygen": "溶氧 (mg/L)",
        "turbidity": "濁度 (NTU)"
    };
    return names[metric] || metric;
}
