javascript:(async()=>{try{
const studioId="51407751";

/* Cookie から CSRF Token を取得 */
function getCookie(name){
  return document.cookie.split("; ").find(r=>r.startsWith(name+"="))?.split("=")[1];
}
const csrfToken = getCookie("scratchcsrftoken");

/* X-Token を取得 */
const session = await fetch("/session",{
  headers:{"x-requested-with":"XMLHttpRequest"}
}).then(r=>r.json());
const xToken = session.user.token;

/* GitHub から README を取得 */
const readme = await fetch("https://raw.githubusercontent.com/YU-TechnicalDepartment/Scratch-Ranking-Public/main/README.md").then(r=>r.text());

/* コードブロックから説明欄テキスト抽出 */
const match = readme.match(/```([\s\S]*?)```/);
if(!match){alert("READMEから説明欄テキストを取得できませんでした");return;}
const descText = match[1].trim();

/* 説明欄を更新（PUT + CSRF + Cookie） */
await fetch(`https://scratch.mit.edu/site-api/galleries/all/${studioId}/`,{
  method:"PUT",
  credentials:"include",
  headers:{
    "content-type":"application/json",
    "x-csrftoken":csrfToken,
    "x-requested-with":"XMLHttpRequest"
  },
  body:JSON.stringify({description:descText})
});

/* README から project ID を抽出 */
const idRegex=/projects\/(\d+)/g;
let ids=[],m;
while((m=idRegex.exec(readme))!==null){ids.push(m[1]);}

/* 現在の作品一覧を取得 */
const current = await fetch(`https://api.scratch.mit.edu/studios/${studioId}/projects`).then(r=>r.json());
const currentIds = current.map(p=>p.id);

/* 全削除（DELETE + X-Token） */
for(const pid of currentIds){
  await fetch(`https://api.scratch.mit.edu/studios/${studioId}/project/${pid}`,{
    method:"DELETE",
    headers:{
      "x-token":xToken,
      "x-requested-with":"XMLHttpRequest"
    }
  });
}

/* 逆順で追加（POST + X-Token） */
ids.reverse();
for(const pid of ids){
  await fetch(`https://api.scratch.mit.edu/studios/${studioId}/project/${pid}`,{
    method:"POST",
    headers:{
      "x-token":xToken,
      "x-requested-with":"XMLHttpRequest"
    }
  });
}

alert("説明欄更新・全削除・逆順追加が完了しました！");
}catch(e){alert("エラー: "+e);}})();
