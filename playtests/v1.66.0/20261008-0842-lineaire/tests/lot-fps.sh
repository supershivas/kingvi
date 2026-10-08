S=/tmp/claude-0/-home-user-kingvi/417019d7-415a-5612-9d2a-853add2277aa/scratchpad/v1650
L='["barque","ravin","foret-noire","maison","falaise"]'
for q in 1 2 3; do
  timeout 600 node rendu.mjs '{"tag":"fps166-q'$q'","q":'$q',"meteo":null,"lieux":'$L',"attente":4000}' >/dev/null 2>>rendu/err.log
  KROOT=$S timeout 600 node rendu.mjs '{"tag":"fps165-q'$q'","q":'$q',"meteo":null,"lieux":'$L',"attente":4000}' >/dev/null 2>>rendu/err.log
done
echo fini
