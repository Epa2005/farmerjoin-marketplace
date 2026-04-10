import { useState } from "react"
import { useNewTranslation } from "../hooks/useNewTranslation"

export default function Index(){
    const { t } = useNewTranslation();
    const [name,setName] = useState("");
   function handleClickName(){
    const inputName =document.getElementById("name").value;
    setName(inputName)

   }
    return(
        <>
        <p>
            {t('helloMyNameIs')} {name}.</p>
            <input id="name" type="text" />
            
            <button onClick={handleClickName}>{t('updateName')}</button></>
    )
}