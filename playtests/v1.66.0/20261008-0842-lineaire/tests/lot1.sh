L='["barque","ravin","foret-noire","falaise","grotte"]'
run(){ timeout 600 node rendu.mjs "$1" > /dev/null 2>>rendu/err.log; }
run '{"tag":"d1-q1","q":1,"dpr":1,"lieux":'$L'}' &
run '{"tag":"d125-q1","q":1,"dpr":1.25,"lieux":'$L'}' &
wait
run '{"tag":"d2-q1","q":1,"dpr":2,"lieux":'$L'}' &
run '{"tag":"d125-q2","q":2,"dpr":1.25,"lieux":["barque","ravin"]}' &
wait
run '{"tag":"d1-q2","q":2,"dpr":1,"lieux":["barque","ravin"]}' &
run '{"tag":"d2-q2","q":2,"dpr":2,"lieux":["barque","ravin"]}' &
wait
for t in 1440x900 1920x1080 1024x640; do run '{"tag":"t'$t'-q1","q":1,"taille":"'$t'","lieux":["barque","ravin"]}' & done; wait
for t in 1440x900 1920x1080 1024x640; do run '{"tag":"t'$t'-q2","q":2,"dpr":1.25,"taille":"'$t'","lieux":["barque"]}' & done; wait
echo fini
