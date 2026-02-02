// logic.js - Core Calculation
async function loadSystem() {
    try {
        // ดึง Config จากไฟล์ JSON
        const response = await fetch('data.json'); 
        const config = await response.json();
        
        // เริ่มวาดหน้าจอ
        initUI(config);
    } catch (error) {
        console.error("Error loading config:", error);
        alert("ไม่สามารถโหลดข้อมูล Config ได้");
    }
}

function initUI(config) {
    const select = document.getElementById('statusSelect');
    
    // สร้าง Dropdown
    config.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.name;
        opt.innerText = c.name;
        select.appendChild(opt);
    });

    // ผูก Event
    select.addEventListener('change', () => updateLabels(config));
    const inputs = document.querySelectorAll('input');
    inputs.forEach(inp => inp.addEventListener('input', () => calculate(config)));

    // เริ่มทำงานครั้งแรก
    updateLabels(config);
    calculate(config);
}

function updateLabels(config) {
    const select = document.getElementById('statusSelect');
    const currentName = select.value;
    const data = config.find(c => c.name === currentName);
    
    document.getElementById('lbl_atk_stat').innerText = data.atk;
    document.getElementById('lbl_def_chance').innerText = data.defC;
    document.getElementById('lbl_def_time').innerText = data.defT;
    
    calculate(config);
}

function calculate(config) {
    const select = document.getElementById('statusSelect');
    const statusName = select.value;
    const data = config.find(c => c.name === statusName);

    // ดึงค่าจาก Input
    const getVal = (id) => parseFloat(document.getElementById(id).value) || 0;
    
    const B3 = getVal('inp_base');
    const C3 = getVal('inp_time');
    const E3 = getVal('inp_atk_stat');
    const F3 = getVal('inp_status_atk');
    const G3 = getVal('inp_cc_atk');
    const I3 = getVal('inp_def_chance');
    const K3 = getVal('inp_def_time');
    const L3 = getVal('inp_res');
    const M3 = getVal('inp_cc_res');

    // ==========================================
    // พื้นที่ใส่สูตร (Formula Area)
    // ==========================================
    
    // Formula Q
    let q_limit1 = (['Blind', 'Curse', 'Bleed'].includes(statusName)) ? 1 : 0.8;
    let q_poison_factor = (statusName === 'Poison') ? 0.2 : 0.3;
    let q_limit2 = (E3 * q_poison_factor) / 100;
    const Q3 = Math.min(q_limit1, q_limit2);

    // Formula N (Chance)
    let n_part1 = B3 * (1 + (F3/100) - (L3/100));
    let n_limitA;
    if (['Blind', 'Curse', 'Silence'].includes(statusName)) n_limitA = 1;
    else if (['Bleed', 'Burn', 'Poison'].includes(statusName)) n_limitA = 0.8;
    else n_limitA = 0.6;
    
    let n_bonusA_factor = (['Stun', 'Sleep', 'Freeze', 'Stone', 'Snare'].includes(statusName)) ? 0.2 : 0.3;
    let n_bonusA = (E3 * n_bonusA_factor) / 100;
    let n_malusA_factor = (['Curse', 'Silence'].includes(statusName)) ? 0.3 : 0.2;
    let n_malusA = (I3 * n_malusA_factor) / 100;
    let n_term2 = 1 + Math.min(n_limitA, n_bonusA) - Math.min(1, n_malusA);
    const ResultN = Math.max(0, n_part1 * n_term2);

    // Formula O (Duration)
    let o_gear = 1 + ((G3 - M3) / 100);
    let o_stat_reduc = Math.min(1, (K3 * 0.4) / 100);
    let o_stat_mod = 1 + (Q3 - o_stat_reduc);
    let o_atk_res_mod = 1 + ((F3 - L3) / 100);
    const ResultO = Math.min(1, Math.max(0, 1 * o_gear * o_stat_mod * o_atk_res_mod));

    // Formula P (Final Time)
    const ResultP = ResultO * C3;

    // แสดงผล
    const resN = document.getElementById('res_chance');
    const resO = document.getElementById('res_duration_pct');
    const resP = document.getElementById('res_final_time');

    resN.innerHTML = ResultN.toFixed(2) + '<span class="unit">%</span>';
    resO.innerHTML = (ResultO * 100).toFixed(0) + '<span class="unit">%</span>';
    resP.innerHTML = ResultP.toFixed(2) + '<span class="unit">s</span>';
    
    resP.style.opacity = (ResultN === 0) ? 0.3 : 1;
}

// Start System
loadSystem();
