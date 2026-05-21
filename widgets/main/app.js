const base='/data/';
function safeParse(t){
 return t.split(/?
/).filter(x=>x.trim()!=='').slice(1).map(x=>x.split(','));
}

async function load(f){
 let r=await fetch(base+f);
 if(!r.ok) throw new Error(f+' not found');
 return safeParse(await r.text());
}

Promise.all([load('Transactions.csv'),load('Settings.csv')])
.then(([t,s])=>{
 let name=s[0][1];
 let inc=0,exp=0,sav=0;
 let monthly={};
 let cat={};

 t.forEach(x=>{
  let d=x[0].slice(0,7);
  let v=+x[4];
  if(!monthly[d]) monthly[d]={inc:0,exp:0,sav:0};
  if(x[2]=='Income'){inc+=v; monthly[d].inc+=v}
  if(x[2]=='Expense'){exp+=v; monthly[d].exp+=v; cat[x[3]]=(cat[x[3]]||0)+v}
  if(x[2]=='Investment'){sav+=v; monthly[d].sav+=v}
 });

 let net=inc-exp;
 let rate=((sav/inc)*100||0).toFixed(1);

 // multi-line chart
 let months=Object.keys(monthly);
 let lineInc=months.map((m,i)=>`${i*50},${160-monthly[m].inc/100}`).join(' ');
 let lineExp=months.map((m,i)=>`${i*50},${160-monthly[m].exp/50}`).join(' ');

 // donut calc
 let total=exp+sav||1;
 let needs=(cat['Housing']||0)/total*100;
 let wants=(cat['Food']||0 + cat['Lifestyle']||0 + cat['Leisure']||0)/total*100;

 // insights
 let insight='✅ Strong financial health';
 if(exp>inc) insight='🚨 Overspending detected';
 else if(rate<20) insight='⚠️ Savings below 20%';

 document.getElementById('app').innerHTML=`
 <h2>Hello ${name}</h2>
 <div class='grid'>
  <div class='card'>Net Worth<br>$${net}</div>
  <div class='card'>Cash Flow<br>$${net}</div>
  <div class='card'>Savings Rate<br>${rate}%</div>
  <div class='card'>Runway<br>6 months</div>
 </div>

 <div class='row'>
  <div class='card'><b>Top Reminders</b><br>Review expenses</div>
  <div class='card'><b>Quick Capture</b><br>Add transaction</div>
  <div class='card'>
   <b>Planner Graphs</b>
   <svg>
    <polyline points='${lineInc}' stroke='green' fill='none'/>
    <polyline points='${lineExp}' stroke='red' fill='none'/>
   </svg>
   <svg>
     <circle cx='80' cy='80' r='60' stroke='#ddd' stroke-width='15' fill='none'/>
     <circle cx='80' cy='80' r='60' stroke='blue' stroke-width='15' fill='none' stroke-dasharray='${needs*3.7},999'/>
   </svg>
  </div>
 </div>

 <div class='modules'>
 ${Object.keys(cat).map(c=>`<div class='module'>${c}<br>$${cat[c]}<div class='hover'>Recent ${c}</div></div>`).join('')}
 </div>

 <div class='card'><b>AI Insights</b><br>${insight}</div>
 `;
})
.catch(e=>document.getElementById('app').innerHTML='ERROR: '+e);
