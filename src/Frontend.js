import React, {useState} from "react";
import axios from "axios";


const FrontEnd = () => {
  const [ner_output, setNEROutput]= useState("");
  const [passage, setPassage] = useState("");
  const [qa_output, setQAOutput]= useState("");
  
  const getRelation = async(userInput)=>{
    try{
        await axios.get("http://localhost:5000/ner", {params: {input: userInput}}) //Get the Named Entities from User Input
                .then((res) => {
                  if (res.data == "There must be two entities in the input")
                  {
                    throw "There must be two entities in the input";
                  }
                  else if (res.data == "Please provide input")
                  {
                    throw "Please provide input";
                  }
                  else
                  {
                    setNEROutput(res.data); //Store the named entities in NEROutput
                    return res.data;
                  }
                }).then(async (ner_output)=>{
                      await axios.get('http://localhost:9200/content/_doc/_search', { //Get the passage where the two entities are found
                            params: { source: JSON.stringify({
                              query: {
                                "bool":{
                                  "must": [
                                        {
                                          "match_phrase":{"passage":ner_output.entity1}
                                        },
                                        {
                                          "match_phrase":{"passage":ner_output.entity2}
                                        }
                                  ]
                                }
                              }}),                     
                              source_content_type: 'application/json'
                            }})
                            .then((res)=>{
                              if (res.data.hits.hits.length === 0)
                              {
                                throw "NO DATA";
                              }
                              else
                              {
                                setPassage(res.data.hits.hits[0]._source.passage);
                                return res.data.hits.hits[0]._source.passage;
                              }
                            })
                            .catch(function (error) {
                              if (error == "NO DATA" || error.request)
                              {
                                throw "No data available";
                              }
                            })
                            .then(async (passage)=>{
                              await axios.get("http://localhost:5000/re", { //Get the Question and Answer
                                    params: {
                                      entity1: ner_output.entity1, 
                                      entity2: ner_output.entity2, 
                                      type1: ner_output.type1, 
                                      type2: ner_output.type2, 
                                      doc: passage } })
                                    .then((res)=>{
                                      if (res.data=="The input pair does not show a relation between each other")
                                      {
                                        throw "The input pair does not show a relation between each other"
                                      }
                                      else
                                      {
                                        setQAOutput(res.data)
                                      }
                                    });
                              });
                    });}
                    catch(e){
                      setNEROutput("")
                      setPassage("")
                      setQAOutput("")
                      alert(e)
                    }
  }
  
  const handleSubmit= (event) => {
    event.preventDefault();
    const Input = event.target.userInput.value;
    event.target.userInput.value="";
    getRelation(Input);
  };

  return (
    <div>
      <form class = "form" onSubmit={handleSubmit}>
        <label class ="input">
          <input type ="text" name = "userInput" defaultValue = "" class = "forminput" placeholder = "Input"/>
        </label> {''}
        <input type ="submit" value ="Submit" class ="submit"/>
      </form>
      <div>
        <div class = "entities">
          <p class = "entitytitle"> Entities </p>
          <div class = "entity">
            <p class = "entityname">{ner_output.entity1}</p> 
            <p class = "entitytype">{ner_output.type1}</p>
          </div>
          <div class = "entity">
            <p class = "entityname">{ner_output.entity2}</p> 
            <p class = "entitytype">{ner_output.type2}</p>
          </div>
        </div>
        <div class = "qna">
          <div class= "question">
            <p class = "questiontitle"> Question </p>
            <p class = "questionfield">{qa_output.question}</p>
          </div>
          <div class= "answer">
            <p class = "answertitle"> Answer </p>
            <p class = "answerfield">{qa_output.answer}</p>
          </div>
        </div>
        </div>
    </div>
  );
};
export default FrontEnd;